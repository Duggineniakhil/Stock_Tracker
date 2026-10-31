"""Hourly Quotra alert engine as an Airflow DAG.

Replaces backend/alertWorker.ts (node-cron '0 * * * *' -> alertEngine.runAlertEngine):

    extract_active_rules -> fetch_market_data -> evaluate_rules (PySpark)
        -> load_alerts -> send_alert_emails -> cleanup

Configuration (environment of the Airflow workers):
    QUOTRA_DB_PATH      SQLite database used by the backend (backend/db/stocks.db)
    QUOTRA_STAGING_DIR  scratch space shared by the workers and the Spark driver
    EMAIL_*             same SMTP settings as backend/.env
Spark is submitted through the `spark_default` connection.
"""
import os
from datetime import timedelta

import pendulum
from airflow.decorators import dag, task
from airflow.exceptions import AirflowSkipException
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
from airflow.utils.trigger_rule import TriggerRule

import alert_engine_tasks as steps

DB_PATH = os.environ.get("QUOTRA_DB_PATH", "/opt/quotra/backend/db/stocks.db")
STAGING_ROOT = os.environ.get("QUOTRA_STAGING_DIR", "/tmp/quotra_alert_engine")
SPARK_JOB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "jobs", "evaluate_alert_rules.py")

# Rendered per run, e.g. /tmp/quotra_alert_engine/20261031T130000
STAGING_DIR = STAGING_ROOT + "/{{ ts_nodash }}"


@dag(
    dag_id="quotra_alert_engine",
    schedule="0 * * * *",
    start_date=pendulum.datetime(2026, 10, 1, tz="UTC"),
    catchup=False,  # rules are evaluated against live quotes, so past hours can't be replayed
    max_active_runs=1,
    dagrun_timeout=timedelta(minutes=50),
    default_args={"retries": 2, "retry_delay": timedelta(minutes=2)},
    tags=["quotra", "alerts"],
)
def quotra_alert_engine():
    @task
    def extract_active_rules(staging_dir: str) -> list[str]:
        symbols = steps.extract_active_rules(DB_PATH, staging_dir)
        if not symbols:
            raise AirflowSkipException("No active alert rules found")
        return symbols

    @task
    def fetch_market_data(symbols: list[str], staging_dir: str) -> None:
        if steps.fetch_market_data(symbols, staging_dir) == 0:
            raise AirflowSkipException("No market data could be fetched")

    evaluate_rules = SparkSubmitOperator(
        task_id="evaluate_rules",
        conn_id="spark_default",
        application=SPARK_JOB,
        name="quotra_evaluate_alert_rules",
        application_args=["--staging-dir", STAGING_DIR, "--now", "{{ data_interval_end.isoformat() }}"],
        conf={"spark.sql.session.timeZone": "UTC"},
    )

    @task
    def load_alerts(staging_dir: str) -> list[int]:
        return steps.load_alerts(DB_PATH, f"{staging_dir}/alerts")

    @task
    def send_alert_emails(rule_ids: list[int], staging_dir: str) -> int:
        return steps.send_alert_emails(f"{staging_dir}/alerts", rule_ids)

    # Runs after a skip (no rules / no data) too, but keeps the files when a step failed.
    @task(trigger_rule=TriggerRule.NONE_FAILED)
    def cleanup(staging_dir: str) -> None:
        steps.cleanup(staging_dir)

    symbols = extract_active_rules(STAGING_DIR)
    fetched = fetch_market_data(symbols, STAGING_DIR)
    loaded = load_alerts(STAGING_DIR)
    fetched >> evaluate_rules >> loaded
    send_alert_emails(loaded, STAGING_DIR) >> cleanup(STAGING_DIR)


quotra_alert_engine()
