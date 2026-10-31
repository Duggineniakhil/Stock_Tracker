"""Extract, market-data, load and notify steps for the quotra_alert_engine DAG.

These are plain functions with no Airflow imports, so they can be tested and run
on their own. The rule evaluation itself lives in jobs/evaluate_alert_rules.py.
"""
import html
import logging
import os
import shutil
import smtplib
import sqlite3
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq

log = logging.getLogger(__name__)

COOLDOWN_HOURS = 24

# Explicit schemas so an all-null column (e.g. last_triggered_at) still has a type Spark can read.
RULES_SCHEMA = pa.schema([
    ("id", pa.int64()),
    ("user_id", pa.int64()),
    ("symbol", pa.string()),
    ("template_type", pa.string()),
    ("condition_operator", pa.string()),
    ("condition_value", pa.float64()),
    ("priority", pa.string()),
    ("last_triggered_at", pa.string()),
    ("email", pa.string()),
    ("plan", pa.string()),
    ("name", pa.string()),
])
QUOTES_SCHEMA = pa.schema([
    ("symbol", pa.string()),
    ("quote_symbol", pa.string()),
    ("current_price", pa.float64()),
    ("change", pa.float64()),
    ("change_percent", pa.float64()),
    ("volume", pa.int64()),
    ("avg_volume", pa.int64()),
])
HISTORY_SCHEMA = pa.schema([
    ("symbol", pa.string()),
    ("date", pa.string()),
    ("close", pa.float64()),
])

ACTIVE_RULES_SQL = """
    SELECT ar.id, ar.user_id, ar.symbol, ar.template_type, ar.condition_operator,
           ar.condition_value, ar.priority, ar.last_triggered_at, u.email, u.plan, u.name
    FROM alert_rules ar
    JOIN users u ON ar.user_id = u.id
    WHERE ar.is_active = 1
"""


def extract_active_rules(db_path: str, staging_dir: str) -> list[str]:
    """Snapshot active rules to rules.parquet and return their distinct symbols."""
    conn = sqlite3.connect(Path(db_path).resolve().as_uri() + "?mode=ro", uri=True)
    try:
        conn.row_factory = sqlite3.Row
        rows = [dict(r) for r in conn.execute(ACTIVE_RULES_SQL)]
    finally:
        conn.close()

    Path(staging_dir).mkdir(parents=True, exist_ok=True)
    pq.write_table(pa.Table.from_pylist(rows, schema=RULES_SCHEMA), f"{staging_dir}/rules.parquet")
    symbols = sorted({r["symbol"] for r in rows})
    log.info("Extracted %d active rules across %d symbols", len(rows), len(symbols))
    return symbols


def fetch_market_data(symbols: list[str], staging_dir: str) -> int:
    """Write quotes.parquet and history.parquet (1 month of daily closes); return quotes fetched.

    Mirrors stockService.getStockQuote / getHistoricalData: a symbol whose quote fails
    is skipped, and a symbol whose history fails is still evaluated without RSI.
    """
    import yfinance as yf

    quotes, history = [], []
    for symbol in symbols:
        ticker = yf.Ticker(symbol.upper())
        try:
            info = ticker.info
            if info.get("regularMarketPrice") is None:
                raise ValueError("no quote returned")
            quotes.append({
                "symbol": symbol,
                "quote_symbol": info.get("symbol") or symbol.upper(),
                "current_price": float(info["regularMarketPrice"]),
                "change": float(info.get("regularMarketChange") or 0),
                "change_percent": float(info.get("regularMarketChangePercent") or 0),
                "volume": int(info.get("regularMarketVolume") or 0),
                "avg_volume": int(info.get("averageDailyVolume3Month") or info.get("averageDailyVolume10Day") or 0),
            })
        except Exception as exc:
            log.error("Error processing symbol %s: %s", symbol, exc)
            continue

        try:
            closes = ticker.history(period="1mo", interval="1d")["Close"].dropna()
            history.extend(
                {"symbol": symbol, "date": ts.tz_convert("UTC").isoformat(), "close": float(close)}
                for ts, close in closes.items()
            )
        except Exception as exc:
            log.warning("Failed to fetch history for %s, RSI rules will not fire: %s", symbol, exc)

    pq.write_table(pa.Table.from_pylist(quotes, schema=QUOTES_SCHEMA), f"{staging_dir}/quotes.parquet")
    pq.write_table(pa.Table.from_pylist(history, schema=HISTORY_SCHEMA), f"{staging_dir}/history.parquet")
    log.info("Fetched %d/%d quotes, %d history points", len(quotes), len(symbols), len(history))
    return len(quotes)


def read_alerts(alerts_dir: str) -> list[dict]:
    if not Path(alerts_dir).exists():
        return []
    return pq.read_table(alerts_dir).to_pylist()


def load_alerts(db_path: str, alerts_dir: str) -> list[int]:
    """Record fired alerts in user_alerts and start each rule's cooldown; return the rule ids loaded.

    Each alert is claimed with a conditional UPDATE on last_triggered_at, so a retried
    run (or a rule that fired since the snapshot) never inserts a duplicate alert.
    """
    alerts = read_alerts(alerts_dir)
    loaded = []
    conn = sqlite3.connect(db_path, timeout=30)
    try:
        with conn:
            for alert in alerts:
                claimed = conn.execute(
                    """UPDATE alert_rules SET last_triggered_at = CURRENT_TIMESTAMP
                       WHERE id = ? AND is_active = 1
                         AND (last_triggered_at IS NULL OR last_triggered_at <= datetime('now', ?))""",
                    (alert["rule_id"], f"-{COOLDOWN_HOURS} hours"),
                ).rowcount
                if claimed != 1:
                    log.info("Rule %s already triggered or deactivated, skipping", alert["rule_id"])
                    continue
                conn.execute(
                    """INSERT INTO user_alerts (user_id, symbol, message, reason, priority, alertType)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (alert["user_id"], alert["symbol"], alert["message"], alert["reason"],
                     alert["priority"], alert["template_type"]),
                )
                loaded.append(alert["rule_id"])
                log.info("Alert Triggered: %s | %s | %s", alert["email"], alert["symbol"], alert["reason"])
    finally:
        conn.close()
    return loaded


def build_alert_email(alert: dict) -> tuple[str, str]:
    """Subject and HTML body, same layout as backend/services/emailService.ts."""
    change, change_pct = alert["change"], alert["change_percent"]
    up = change >= 0
    symbol = html.escape(alert["quote_symbol"])
    subject = f"Stock Alert: {alert['quote_symbol']} {'rose' if up else 'fell'} {abs(change_pct):.2f}%"
    body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Stock Alert: {symbol}</h2>
        <p style="font-size: 16px;"><strong>{symbol}</strong> just moved significantly.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0; font-size: 18px;">Current Price: <strong>${alert['current_price']:.2f}</strong></p>
            <p style="margin: 5px 0; font-size: 18px; color: {'green' if up else 'red'};">
                Change: <strong>{'↑' if up else '↓'} {abs(change):.2f} ({abs(change_pct):.2f}%)</strong>
            </p>
        </div>
        <div style="margin-top: 20px;">
            <h3 style="color: #555;">Analysis</h3>
            <p style="font-style: italic; color: #666;">{html.escape(alert['reason'])}</p>
        </div>
        <p style="font-size: 12px; color: #999; margin-top: 30px;">
            Time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}
        </p>
    </div>
    """
    return subject, body


def send_alert_emails(alerts_dir: str, rule_ids: list[int]) -> int:
    """Email each loaded alert using the backend's EMAIL_* settings; return emails sent.

    Like the Node engine, a failed send is logged rather than failing the run.
    """
    wanted = set(rule_ids)
    alerts = [a for a in read_alerts(alerts_dir) if a["rule_id"] in wanted]
    if not alerts:
        return 0

    host = os.environ.get("EMAIL_HOST")
    if not host:
        log.warning("EMAIL_HOST is not set, skipping %d alert emails", len(alerts))
        return 0
    port = int(os.environ.get("EMAIL_PORT", "587"))
    secure = os.environ.get("EMAIL_SECURE", "false") == "true"
    user, password = os.environ.get("EMAIL_USER"), os.environ.get("EMAIL_PASS")
    sender = os.environ.get("EMAIL_FROM", "onboarding@resend.dev")

    sent = 0
    try:
        smtp = smtplib.SMTP_SSL(host, port, timeout=30) if secure else smtplib.SMTP(host, port, timeout=30)
        with smtp:
            smtp.ehlo()
            if not secure and smtp.has_extn("starttls"):
                smtp.starttls()
            if user:
                smtp.login(user, password or "")
            for alert in alerts:
                subject, body = build_alert_email(alert)
                msg = EmailMessage()
                msg["From"], msg["To"], msg["Subject"] = sender, alert["email"], subject
                msg.set_content(alert["message"])
                msg.add_alternative(body, subtype="html")
                try:
                    smtp.send_message(msg)
                    sent += 1
                except smtplib.SMTPException as exc:
                    log.error("Error sending email to %s for %s: %s", alert["email"], alert["symbol"], exc)
    except (OSError, smtplib.SMTPException) as exc:
        log.error("Could not connect to SMTP server %s:%s: %s", host, port, exc)
    return sent


def cleanup(staging_dir: str) -> None:
    shutil.rmtree(staging_dir, ignore_errors=True)
