import sqlite3
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq
import pytest

import alert_engine_tasks as steps

SCHEMA_SQL = Path(__file__).resolve().parents[2] / "backend" / "db" / "schema.sql"

ALERTS_SCHEMA = pa.schema([
    ("rule_id", pa.int64()), ("user_id", pa.int64()), ("email", pa.string()), ("symbol", pa.string()),
    ("quote_symbol", pa.string()), ("template_type", pa.string()), ("priority", pa.string()),
    ("reason", pa.string()), ("message", pa.string()), ("current_price", pa.float64()),
    ("change", pa.float64()), ("change_percent", pa.float64()),
])


@pytest.fixture
def db_path(tmp_path):
    path = tmp_path / "stocks.db"
    conn = sqlite3.connect(path)
    conn.executescript(SCHEMA_SQL.read_text())
    conn.execute("INSERT INTO users (id, name, email, password_hash) VALUES (1, 'Test', 'user@example.test', 'x')")
    rules = [
        # id, symbol, last_triggered_at, is_active
        (1, "AAPL", None, 1),
        (2, "MSFT", "2000-01-01 00:00:00", 1),
        (3, "TSLA", None, 0),
        (4, "NVDA", "2999-01-01 00:00:00", 1),  # still in cooldown
    ]
    conn.executemany(
        """INSERT INTO alert_rules (id, user_id, symbol, template_type, condition_operator, condition_value,
                                    last_triggered_at, is_active)
           VALUES (?, 1, ?, 'TARGET_PRICE', 'ABOVE', 1, ?, ?)""",
        rules,
    )
    conn.commit()
    conn.close()
    return str(path)


def _write_alerts(alerts_dir, rule_ids):
    rows = [{
        "rule_id": rid, "user_id": 1, "email": "user@example.test", "symbol": sym, "quote_symbol": sym,
        "template_type": "TARGET_PRICE", "priority": "MEDIUM", "reason": "Price reached $5.00 (Target: >= $1)",
        "message": f"{sym} alert: Price reached $5.00 (Target: >= $1)", "current_price": 5.0,
        "change": -0.25, "change_percent": -4.76,
    } for rid, sym in rule_ids]
    alerts_dir.mkdir()
    pq.write_table(pa.Table.from_pylist(rows, schema=ALERTS_SCHEMA), alerts_dir / "part-00000.parquet")
    (alerts_dir / "_SUCCESS").touch()


def test_extract_active_rules(db_path, tmp_path):
    symbols = steps.extract_active_rules(db_path, str(tmp_path / "stage"))

    assert symbols == ["AAPL", "MSFT", "NVDA"]
    rules = pq.read_table(tmp_path / "stage" / "rules.parquet").to_pylist()
    assert {r["id"] for r in rules} == {1, 2, 4}
    assert all(r["email"] == "user@example.test" for r in rules)


def test_load_alerts_is_idempotent(db_path, tmp_path):
    alerts_dir = tmp_path / "alerts"
    _write_alerts(alerts_dir, [(1, "AAPL"), (2, "MSFT"), (3, "TSLA"), (4, "NVDA")])

    assert steps.load_alerts(db_path, str(alerts_dir)) == [1, 2]
    # A retry of the same run must not insert the alerts again
    assert steps.load_alerts(db_path, str(alerts_dir)) == []

    conn = sqlite3.connect(db_path)
    stored = conn.execute("SELECT user_id, symbol, alertType, priority FROM user_alerts ORDER BY id").fetchall()
    cooldowns = dict(conn.execute("SELECT id, last_triggered_at FROM alert_rules"))
    conn.close()
    assert stored == [(1, "AAPL", "TARGET_PRICE", "MEDIUM"), (1, "MSFT", "TARGET_PRICE", "MEDIUM")]
    assert cooldowns[1] is not None and cooldowns[2] > "2000-01-01 00:00:00"
    assert cooldowns[3] is None


def test_load_alerts_without_output(db_path, tmp_path):
    assert steps.load_alerts(db_path, str(tmp_path / "missing")) == []


def test_build_alert_email_matches_backend_template():
    subject, body = steps.build_alert_email({
        "quote_symbol": "AAPL", "current_price": 5.0, "change": -0.25, "change_percent": -4.76,
        "reason": "RSI <30",
    })
    assert subject == "Stock Alert: AAPL fell 4.76%"
    assert "Current Price: <strong>$5.00</strong>" in body
    assert "↓ 0.25 (4.76%)" in body
    assert "RSI &lt;30" in body


def test_send_alert_emails_without_smtp_config(tmp_path, monkeypatch):
    monkeypatch.delenv("EMAIL_HOST", raising=False)
    _write_alerts(tmp_path / "alerts", [(1, "AAPL")])
    assert steps.send_alert_emails(str(tmp_path / "alerts"), [1]) == 0
