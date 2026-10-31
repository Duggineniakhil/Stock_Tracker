"""Evaluate Quotra alert rules against a market-data snapshot.

PySpark port of evaluateRule() in backend/services/alertEngine.ts. Reads the
parquet files staged by the quotra_alert_engine DAG and writes the rules that
fired to <staging-dir>/alerts.

    spark-submit evaluate_alert_rules.py --staging-dir DIR --now 2026-10-31T13:00:00+00:00
"""
import argparse
from datetime import datetime, timezone

from pyspark.sql import Column, DataFrame, SparkSession
from pyspark.sql import functions as F
from pyspark.sql import types as T

COOLDOWN_HOURS = 24
RSI_PERIOD = 14
DEFAULT_VOLUME_MULTIPLIER = 2.0
SQLITE_TS_FORMAT = "yyyy-MM-dd HH:mm:ss"


def wilder_rsi(closes, period=RSI_PERIOD):
    """Same algorithm as stockService.calculateRSI: Wilder-smoothed RSI over daily closes."""
    if closes is None or len(closes) <= period:
        return None

    gains = losses = 0.0
    for i in range(1, period + 1):
        diff = closes[i] - closes[i - 1]
        if diff >= 0:
            gains += diff
        else:
            losses -= diff

    avg_gain = gains / period
    avg_loss = losses / period
    for i in range(period + 1, len(closes)):
        diff = closes[i] - closes[i - 1]
        avg_gain = (avg_gain * (period - 1) + max(diff, 0.0)) / period
        avg_loss = (avg_loss * (period - 1) + max(-diff, 0.0)) / period

    if avg_loss == 0:
        return 100.0
    return 100.0 - 100.0 / (1.0 + avg_gain / avg_loss)


rsi_udf = F.udf(wilder_rsi, T.DoubleType())


def _js_number(col: Column) -> Column:
    """Render a double the way JS template strings do (150.0 -> "150")."""
    return F.regexp_replace(col.cast("string"), r"\.0$", "")


def _two_dp(col: Column) -> Column:
    return F.format_string("%.2f", col)


def compute_rsi(history: DataFrame) -> DataFrame:
    """symbol, rsi from (symbol, date, close) rows; dates are ISO strings so they sort correctly."""
    points = (
        history.where(F.col("close").isNotNull())
        .groupBy("symbol")
        .agg(F.array_sort(F.collect_list(F.struct("date", "close"))).alias("points"))
    )
    return points.select("symbol", rsi_udf(F.transform("points", lambda p: p["close"])).alias("rsi"))


def evaluate(rules: DataFrame, quotes: DataFrame, history: DataFrame, now: str) -> DataFrame:
    """Return one row per rule that fires at `now` (UTC, 'yyyy-MM-dd HH:mm:ss').

    Rules whose symbol has no quote are dropped, matching the Node engine skipping
    symbols it could not fetch. Requires spark.sql.session.timeZone=UTC.
    """
    now_ts = F.to_timestamp(F.lit(now), SQLITE_TS_FORMAT)
    last_ts = F.try_to_timestamp(F.col("last_triggered_at"), F.lit(SQLITE_TS_FORMAT))
    out_of_cooldown = last_ts.isNull() | (last_ts <= now_ts - F.expr(f"INTERVAL {COOLDOWN_HOURS} HOURS"))

    df = (
        rules.where(out_of_cooldown)
        .join(quotes, "symbol")
        .join(compute_rsi(history), "symbol", "left")
    )

    template = F.col("template_type")
    operator = F.col("condition_operator")
    value = F.col("condition_value")
    price = F.col("current_price")
    change_pct = F.col("change_percent")
    volume = F.col("volume")
    avg_volume = F.col("avg_volume")
    rsi = F.col("rsi")
    volume_multiplier = F.when(value.isNull() | (value == 0), F.lit(DEFAULT_VOLUME_MULTIPLIER)).otherwise(value)
    has_volume = volume.isNotNull() & (volume != 0) & avg_volume.isNotNull() & (avg_volume != 0)

    reason = (
        F.when(
            (template == "TARGET_PRICE") & (operator == "ABOVE") & (price >= value),
            F.concat(F.lit("Price reached $"), _two_dp(price), F.lit(" (Target: >= $"), _js_number(value), F.lit(")")),
        )
        .when(
            (template == "TARGET_PRICE") & (operator == "BELOW") & (price <= value),
            F.concat(F.lit("Price dropped to $"), _two_dp(price), F.lit(" (Target: <= $"), _js_number(value), F.lit(")")),
        )
        # The Node engine ignores the operator for % change and fires on the absolute move.
        .when(
            (template == "PERCENTAGE_CHANGE") & (F.abs(change_pct) >= value),
            F.concat(
                F.lit("Price moved "),
                F.when(change_pct >= 0, F.lit("+")).otherwise(F.lit("")),
                _two_dp(change_pct),
                F.lit("% (Threshold: "),
                _js_number(value),
                F.lit("%)"),
            ),
        )
        .when(
            (template == "VOLUME_SPIKE") & has_volume & (volume > avg_volume * volume_multiplier),
            F.concat(
                F.lit("Unusual volume detected: "),
                F.format_string("%.1f", volume / avg_volume),
                F.lit("x above average ("),
                F.format_number(volume, 0),
                F.lit(" shares)"),
            ),
        )
        .when(
            (template == "RSI_OVERSOLD") & rsi.isNotNull() & (rsi <= value),
            F.concat(F.lit("RSI reached "), _two_dp(rsi), F.lit(" (Oversold threshold: "), _js_number(value), F.lit(")")),
        )
        .when(
            (template == "RSI_OVERBOUGHT") & rsi.isNotNull() & (rsi >= value),
            F.concat(F.lit("RSI reached "), _two_dp(rsi), F.lit(" (Overbought threshold: "), _js_number(value), F.lit(")")),
        )
    )

    return (
        df.withColumn("reason", reason)
        .where(F.col("reason").isNotNull())
        .select(
            F.col("id").alias("rule_id"),
            "user_id",
            "email",
            "symbol",
            "quote_symbol",
            "template_type",
            "priority",
            "reason",
            F.concat(F.col("symbol"), F.lit(" alert: "), F.col("reason")).alias("message"),
            "current_price",
            "change",
            "change_percent",
        )
    )


def _to_sqlite_utc(iso_ts: str) -> str:
    ts = datetime.fromisoformat(iso_ts)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return ts.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--staging-dir", required=True)
    parser.add_argument("--now", required=True, help="ISO-8601 timestamp the cooldown is measured against")
    args = parser.parse_args(argv)

    spark = (
        SparkSession.builder.appName("quotra_evaluate_alert_rules")
        .config("spark.sql.session.timeZone", "UTC")
        .getOrCreate()
    )
    try:
        staging = args.staging_dir.rstrip("/")
        alerts = evaluate(
            spark.read.parquet(f"{staging}/rules.parquet"),
            spark.read.parquet(f"{staging}/quotes.parquet"),
            spark.read.parquet(f"{staging}/history.parquet"),
            _to_sqlite_utc(args.now),
        )
        alerts.coalesce(1).write.mode("overwrite").parquet(f"{staging}/alerts")
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
