"""
food_prices_dag.py — Kenya Food Prices ETL Pipeline DAG
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

# ── NO top-level heavy imports (no pandas, no etl.*, no psycopg2) ────────────
# Airflow parses this file repeatedly. Any slow import here causes a
# DagBag import timeout and breaks the webserver.


def task_extract(**context):
    from etl.extract import extract_data          # imported INSIDE function
    df = extract_data()
    context["ti"].xcom_push(key="raw_row_count", value=len(df))
    print(f"Extracted {len(df)} rows.")


def task_clean(**context):
    from etl.extract import extract_data          # imported INSIDE function
    from etl.clean import clean_data
    df = extract_data()
    df_clean = clean_data(df)
    context["ti"].xcom_push(key="clean_row_count", value=len(df_clean))
    print(f"Cleaned to {len(df_clean)} rows.")


def task_load(**context):
    from etl.pipeline import run_pipeline         # imported INSIDE function
    run_pipeline()


def task_sql_check(**context):
    import psycopg2                               # imported INSIDE function

    conn = psycopg2.connect(
        host="postgres", port=5432,
        user="postgres", password="Huxtler41268690",
        dbname="kenya_food_prices"
    )
    cur = conn.cursor()
    cur.execute("""
        SELECT COUNT(*) AS total_rows,
               COUNT(DISTINCT commodity) AS commodities,
               COUNT(DISTINCT market)    AS markets,
               MIN(date)                 AS earliest,
               MAX(date)                 AS latest
        FROM raw_food_prices;
    """)
    row = cur.fetchone()
    cur.close()
    conn.close()

    print("─" * 50)
    print(f"  Total rows    : {row[0]}")
    print(f"  Commodities   : {row[1]}")
    print(f"  Markets       : {row[2]}")
    print(f"  Date range    : {row[3]} → {row[4]}")
    print("─" * 50)


# ── DAG definition ────────────────────────────────────────────────────────────

with DAG(
    dag_id="kenya_food_prices_pipeline",
    description="Extract, clean, and load Kenya food prices into PostgreSQL",
    start_date=datetime(2024, 1, 1),
    schedule_interval="@monthly",
    catchup=False,
    tags=["kenya", "food-prices", "etl"],
) as dag:

    extract_task = PythonOperator(
        task_id="extract",
        python_callable=task_extract,
    )

    clean_task = PythonOperator(
        task_id="clean",
        python_callable=task_clean,
    )

    load_task = PythonOperator(
        task_id="load",
        python_callable=task_load,
    )

    sql_check_task = PythonOperator(
        task_id="sql_quality_check",
        python_callable=task_sql_check,
    )

    extract_task >> clean_task >> load_task >> sql_check_task