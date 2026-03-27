"""
pipeline.py — Orchestrates the full ETL run:
  extract → clean → quality_check → load (incremental)
"""

import os
import pandas as pd
from etl.extract import extract_data
from etl.clean import clean_data
from etl.load import load_data, get_connection

# Path where we track the last processed date for incremental loads
WATERMARK_FILE = "/opt/airflow/data/.last_processed_date"


# ── Quality checks ────────────────────────────────────────────────────────────

def run_quality_checks(df: pd.DataFrame) -> pd.DataFrame:
    """
    Basic data quality checks. Raises ValueError if critical checks fail.
    Returns the (possibly filtered) DataFrame if soft checks pass.
    """
    print("🔍 Running quality checks...")

    # 1. Must have rows
    if df.empty:
        raise ValueError("Quality check FAILED: DataFrame is empty after cleaning.")

    # 2. Critical columns must not be null
    critical_cols = ["date", "commodity", "market", "price"]
    for col in critical_cols:
        null_count = df[col].isna().sum()
        if null_count > 0:
            print(f"  ⚠️  Warning: {null_count} null values in '{col}' — dropping rows.")
            df = df.dropna(subset=[col])

    # 3. Prices must be positive
    negative_prices = (df["price"] <= 0).sum()
    if negative_prices > 0:
        print(f"  ⚠️  Warning: {negative_prices} non-positive prices — dropping rows.")
        df = df[df["price"] > 0]

    # 4. Dates must be sensible (2000 onwards)
    bad_dates = (df["date"] < pd.Timestamp("2000-01-01")).sum()
    if bad_dates > 0:
        print(f"  ⚠️  Warning: {bad_dates} rows with dates before 2000 — dropping rows.")
        df = df[df["date"] >= pd.Timestamp("2000-01-01")]

    print(f"  ✅ Quality checks passed. {len(df)} rows remain.")
    return df


# ── Incremental logic ─────────────────────────────────────────────────────────

def get_last_processed_date() -> pd.Timestamp | None:
    """Read the watermark date from disk (None if first run)."""
    if os.path.exists(WATERMARK_FILE):
        with open(WATERMARK_FILE) as f:
            date_str = f.read().strip()
            if date_str:
                return pd.Timestamp(date_str)
    return None


def save_last_processed_date(df: pd.DataFrame) -> None:
    """Persist the max date seen in this run as the new watermark."""
    max_date = df["date"].max()
    os.makedirs(os.path.dirname(WATERMARK_FILE), exist_ok=True)
    with open(WATERMARK_FILE, "w") as f:
        f.write(str(max_date.date()))
    print(f"  📅 Watermark updated to {max_date.date()}")


def filter_new_rows(df: pd.DataFrame) -> pd.DataFrame:
    """Keep only rows newer than the last processed date."""
    last_date = get_last_processed_date()
    if last_date is None:
        print("  🆕 First run — processing all rows.")
        return df
    new_rows = df[df["date"] > last_date]
    print(f"  📥 Incremental: {len(new_rows)} new rows after {last_date.date()}")
    return new_rows


# ── Main pipeline ─────────────────────────────────────────────────────────────

def run_pipeline():
    """Full ETL pipeline: extract → clean → quality check → load."""

    print("=" * 50)
    print("🏁 Starting Kenya Food Prices ETL Pipeline")
    print("=" * 50)

    # 1. Extract
    print("\n[1/4] Extracting data...")
    df_raw = extract_data()
    print(f"  📦 Extracted {len(df_raw)} rows.")

    # 2. Clean
    print("\n[2/4] Cleaning data...")
    df_clean = clean_data(df_raw)
    print(f"  🧹 Cleaned to {len(df_clean)} rows.")

    # 3. Quality checks
    print("\n[3/4] Quality checks...")
    df_clean = run_quality_checks(df_clean)

    # 4. Incremental filter + load
    print("\n[4/4] Loading data...")
    df_new = filter_new_rows(df_clean)

    if df_new.empty:
        print("  ℹ️  No new rows to load — pipeline complete.")
        return

    load_data(df_new, "raw_food_prices")
    save_last_processed_date(df_new)

    print("\n" + "=" * 50)
    print(f"✅ Pipeline complete. {len(df_new)} rows loaded.")
    print("=" * 50)


if __name__ == "__main__":
    run_pipeline()