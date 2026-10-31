# Quotra data pipelines

## `quotra_alert_engine` (Airflow + PySpark)

The hourly alert engine, ported from `backend/alertWorker.ts` / `backend/services/alertEngine.ts`.

```text
extract_active_rules ─► fetch_market_data ─► evaluate_rules ─► load_alerts ─► send_alert_emails ─► cleanup
   SQLite → parquet       yfinance → parquet    spark-submit      → SQLite        SMTP
```

| File | Role |
|------|------|
| `dags/quotra_alert_engine.py` | DAG definition (`0 * * * *`, no catchup, one run at a time) |
| `dags/alert_engine_tasks.py` | Extract, market data, load, email steps (no Airflow imports) |
| `jobs/evaluate_alert_rules.py` | PySpark job: cooldown, RSI, and rule evaluation |
| `tests/` | pytest suite (Spark runs in `local[1]`) |

The rule semantics match the Node engine: 24h cooldown, `PERCENTAGE_CHANGE` fires on the absolute move,
`VOLUME_SPIKE` defaults to 2x average volume, RSI is Wilder's 14-period RSI on 1 month of daily closes,
and the reason and email text use the same wording. `load_alerts` claims each rule with a conditional
`UPDATE` on `last_triggered_at` before inserting into `user_alerts`, so retried runs don't duplicate alerts.

Not ported: the AI explanation for paid plans (`aiService.explainAlert`).

### Running

1. Install `requirements.txt` on the Airflow workers, then point the Airflow `dags_folder` at `data/dags`
   (or copy `data/` there so `../jobs` resolves).
2. Configure the `spark_default` connection (`local[*]` works for a single machine).
3. Set the worker environment variables: `QUOTRA_DB_PATH` (path to `backend/db/stocks.db`),
   `QUOTRA_STAGING_DIR`, and the backend's `EMAIL_*` SMTP settings.
4. Stop `npm run worker`. Running both engines would send every alert twice.

### Tests

```bash
cd data && pip install pyspark pyarrow pytest && pytest tests
```

The tests need Java 17+ for Spark.
