import pytest

from alert_engine_tasks import HISTORY_SCHEMA, QUOTES_SCHEMA, RULES_SCHEMA
from evaluate_alert_rules import evaluate, wilder_rsi

NOW = "2026-10-31 13:00:00"


def _rule(rule_id, symbol, template, operator, value, last_triggered_at=None):
    return {
        "id": rule_id, "user_id": 1, "symbol": symbol, "template_type": template,
        "condition_operator": operator, "condition_value": value, "priority": "HIGH",
        "last_triggered_at": last_triggered_at, "email": "user@example.test", "plan": "free", "name": "Test",
    }


def _quote(symbol, price, change=1.0, change_percent=0.5, volume=1_000_000, avg_volume=1_000_000):
    return {
        "symbol": symbol, "quote_symbol": symbol, "current_price": price, "change": change,
        "change_percent": change_percent, "volume": volume, "avg_volume": avg_volume,
    }


def _history(symbol, closes):
    return [{"symbol": symbol, "date": f"2026-10-{day:02d}T20:00:00+00:00", "close": c}
            for day, c in enumerate(closes, start=1)]


def _df(spark, rows, schema):
    from pyspark.sql.types import StructType, StructField, LongType, StringType, DoubleType
    types = {"int64": LongType(), "string": StringType(), "double": DoubleType()}
    struct = StructType([StructField(f.name, types[str(f.type)]) for f in schema])
    return spark.createDataFrame(rows, struct)


def run(spark, rules, quotes, history=()):
    out = evaluate(
        _df(spark, rules, RULES_SCHEMA),
        _df(spark, quotes, QUOTES_SCHEMA),
        _df(spark, list(history), HISTORY_SCHEMA),
        NOW,
    )
    return {r["rule_id"]: r.asDict() for r in out.collect()}


def test_target_price(spark):
    fired = run(spark, [
        _rule(1, "AAPL", "TARGET_PRICE", "ABOVE", 150.0),
        _rule(2, "AAPL", "TARGET_PRICE", "BELOW", 150.0),
        _rule(3, "AAPL", "TARGET_PRICE", "ABOVE", 152.5),
    ], [_quote("AAPL", 151.234)])

    assert set(fired) == {1}
    assert fired[1]["reason"] == "Price reached $151.23 (Target: >= $150)"
    assert fired[1]["message"] == "AAPL alert: Price reached $151.23 (Target: >= $150)"


def test_target_price_below_keeps_fractional_threshold(spark):
    fired = run(spark, [_rule(1, "AAPL", "TARGET_PRICE", "BELOW", 150.5)], [_quote("AAPL", 149.0)])
    assert fired[1]["reason"] == "Price dropped to $149.00 (Target: <= $150.5)"


def test_percentage_change_uses_absolute_move(spark):
    fired = run(spark, [
        _rule(1, "UP", "PERCENTAGE_CHANGE", "BELOW", 3.0),
        _rule(2, "DOWN", "PERCENTAGE_CHANGE", "ABOVE", 3.0),
        _rule(3, "FLAT", "PERCENTAGE_CHANGE", "ABOVE", 3.0),
    ], [
        _quote("UP", 10.0, change_percent=3.456),
        _quote("DOWN", 10.0, change_percent=-4.0),
        _quote("FLAT", 10.0, change_percent=2.99),
    ])

    assert set(fired) == {1, 2}
    assert fired[1]["reason"] == "Price moved +3.46% (Threshold: 3%)"
    assert fired[2]["reason"] == "Price moved -4.00% (Threshold: 3%)"


def test_volume_spike_defaults_to_2x_when_threshold_is_zero(spark):
    fired = run(spark, [
        _rule(1, "SPIKE", "VOLUME_SPIKE", "ABOVE", 0.0),
        _rule(2, "QUIET", "VOLUME_SPIKE", "ABOVE", 0.0),
        _rule(3, "NOAVG", "VOLUME_SPIKE", "ABOVE", 0.0),
    ], [
        _quote("SPIKE", 10.0, volume=2_500_000, avg_volume=1_000_000),
        _quote("QUIET", 10.0, volume=1_500_000, avg_volume=1_000_000),
        _quote("NOAVG", 10.0, volume=2_500_000, avg_volume=0),
    ])

    assert set(fired) == {1}
    assert fired[1]["reason"] == "Unusual volume detected: 2.5x above average (2,500,000 shares)"


def test_rsi_rules(spark):
    falling = [100.0 - i for i in range(20)]
    rising = [100.0 + i for i in range(20)]
    fired = run(spark, [
        _rule(1, "FALL", "RSI_OVERSOLD", "BELOW", 30.0),
        _rule(2, "RISE", "RSI_OVERBOUGHT", "ABOVE", 70.0),
        _rule(3, "RISE", "RSI_OVERSOLD", "BELOW", 30.0),
        _rule(4, "SHORT", "RSI_OVERSOLD", "BELOW", 30.0),
    ], [_quote("FALL", 81.0), _quote("RISE", 119.0), _quote("SHORT", 10.0)],
        _history("FALL", falling) + _history("RISE", rising) + _history("SHORT", [10.0] * 5))

    assert set(fired) == {1, 2}
    assert fired[1]["reason"] == "RSI reached 0.00 (Oversold threshold: 30)"
    assert fired[2]["reason"] == "RSI reached 100.00 (Overbought threshold: 70)"


def test_cooldown(spark):
    fired = run(spark, [
        _rule(1, "AAPL", "TARGET_PRICE", "ABOVE", 1.0, last_triggered_at="2026-10-31 03:00:00"),
        _rule(2, "AAPL", "TARGET_PRICE", "ABOVE", 1.0, last_triggered_at="2026-10-30 13:00:00"),
        _rule(3, "AAPL", "TARGET_PRICE", "ABOVE", 1.0, last_triggered_at="not a date"),
    ], [_quote("AAPL", 5.0)])

    assert set(fired) == {2, 3}


def test_rule_without_quote_is_skipped(spark):
    assert run(spark, [_rule(1, "GONE", "TARGET_PRICE", "ABOVE", 1.0)], [_quote("AAPL", 5.0)]) == {}


@pytest.mark.parametrize("closes, expected", [
    ([1.0] * 14, None),       # needs more than `period` prices
    ([float(i) for i in range(1, 17)], 100.0),
])
def test_wilder_rsi_edges(closes, expected):
    assert wilder_rsi(closes) == expected


def test_wilder_rsi_matches_node_implementation():
    # Reference value from stockService.calculateRSI on the same series
    closes = [44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08,
              45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 46.22, 45.64]
    assert wilder_rsi(closes) == pytest.approx(57.91502067008556, abs=1e-9)
