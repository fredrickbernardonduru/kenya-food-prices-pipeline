"""
pipeline.py — Orchestrates the full ETL run.
ALL heavy imports are inside functions — never at module level.
This prevents Airflow DagBag import timeouts.
"""

import os


WATERMARK_FILE = "/opt/airflow/data/.last_processed_date"


def run_quality_checks(df):
    import pandas as pd
    print("Running quality checks...")
    if df.empty:
        raise ValueError("Quality check FAILED: DataFrame is empty.")
    critical_cols = ["date", "commodity", "market", "price"]
    for col in critical_cols:
        null_count = df[col].isna().sum()
        if null_count > 0:
            print(f"  Warning: {null_count} null values in '{col}' — dropping rows.")
            df = df.dropna(subset=[col])
    negative_prices = (df["price"] <= 0).sum()
    if negative_prices > 0:
        print(f"  Warning: {negative_prices} non-positive prices — dropping rows.")
        df = df[df["price"] > 0]
    bad_dates = (df["date"] < pd.Timestamp("2000-01-01")).sum()
    if bad_dates > 0:
        print(f"  Warning: {bad_dates} rows with dates before 2000 — dropping rows.")
        df = df[df["date"] >= pd.Timestamp("2000-01-01")]
    print(f"  Quality checks passed. {len(df)} rows remain.")
    return df


def get_last_processed_date():
    import pandas as pd
    if os.path.exists(WATERMARK_FILE):
        with open(WATERMARK_FILE) as f:
            date_str = f.read().strip()
            if date_str:
                return pd.Timestamp(date_str)
    return None


def save_last_processed_date(df):
    max_date = df["date"].max()
    os.makedirs(os.path.dirname(WATERMARK_FILE), exist_ok=True)
    with open(WATERMARK_FILE, "w") as f:
        f.write(str(max_date.date()))
    print(f"  Watermark updated to {max_date.date()}")


def filter_new_rows(df):
    last_date = get_last_processed_date()
    if last_date is None:
        print("  First run — processing all rows.")
        return df
    new_rows = df[df["date"] > last_date]
    print(f"  Incremental: {len(new_rows)} new rows after {last_date.date()}")
    return new_rows


def run_pipeline():
    """Full ETL pipeline — all imports are local to avoid DAG parse timeouts."""
    from etl.extract import extract_data
    from etl.clean import clean_data
    from etl.load import load_data

    print("=" * 50)
    print("Starting Kenya Food Prices ETL Pipeline")
    print("=" * 50)

    print("\n[1/4] Extracting data...")
    df_raw = extract_data()
    print(f"  Extracted {len(df_raw)} rows.")

    print("\n[2/4] Cleaning data...")
    df_clean = clean_data(df_raw)
    print(f"  Cleaned to {len(df_clean)} rows.")

    print("\n[3/4] Quality checks...")
    df_clean = run_quality_checks(df_clean)

    print("\n[4/4] Loading data...")
    df_new = filter_new_rows(df_clean)

    if df_new.empty:
        print("  No new rows to load — pipeline complete.")
        return

    load_data(df_new, "raw_food_prices")
    save_last_processed_date(df_new)

    print("\n" + "=" * 50)
    print(f"Pipeline complete. {len(df_new)} rows loaded.")
    print("=" * 50)


if __name__ == "__main__":
    run_pipeline()