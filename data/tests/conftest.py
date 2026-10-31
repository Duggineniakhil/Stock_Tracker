import os
import sys
from pathlib import Path

import pytest

DATA_DIR = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(DATA_DIR / "jobs"), str(DATA_DIR / "dags")]

# Spark workers must use the same interpreter as the tests, and import the job module
# (under spark-submit it runs as __main__, so its UDFs are shipped by value instead)
os.environ.setdefault("PYSPARK_PYTHON", sys.executable)
os.environ.setdefault("PYSPARK_DRIVER_PYTHON", sys.executable)
os.environ["PYTHONPATH"] = os.pathsep.join(filter(None, [str(DATA_DIR / "jobs"), os.environ.get("PYTHONPATH")]))


@pytest.fixture(scope="session")
def spark():
    from pyspark.sql import SparkSession

    session = (
        SparkSession.builder.master("local[1]")
        .appName("quotra-alert-tests")
        .config("spark.sql.session.timeZone", "UTC")
        .config("spark.ui.enabled", "false")
        .config("spark.sql.shuffle.partitions", "1")
        .getOrCreate()
    )
    yield session
    session.stop()
