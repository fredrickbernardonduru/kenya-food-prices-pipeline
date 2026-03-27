"""
clean.py — Pandas cleaning, standardisation, and enrichment.
"""

import pandas as pd
import re


def _parse_kg_from_unit(unit: str) -> float | None:
    """
    Extract a numeric KG weight from unit strings like '50 KG', '90 KG', 'KG'.
    Returns None if the unit cannot be parsed to a KG quantity.
    """
    if not isinstance(unit, str):
        return None
    unit = unit.strip().upper()
    if unit == "KG":
        return 1.0
    match = re.match(r"^(\d+(?:\.\d+)?)\s*KG$", unit)
    if match:
        return float(match.group(1))
    return None


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and enrich the raw food prices DataFrame.

    Steps:
      1. Copy to avoid SettingWithCopyWarning
      2. Parse dates
      3. Drop rows missing critical geographic fields
      4. Standardise text columns (strip, title-case)
      5. Derive year / month columns
      6. Derive price_per_kg where unit is parseable
    """

    # 1. Explicit copy so we never mutate the caller's DataFrame
    df = df.copy()

    # 2. Parse dates
    df["date"] = pd.to_datetime(df["date"], errors="coerce")

    # 3. Drop rows with missing geography
    df = df.dropna(subset=["admin1", "admin2", "latitude", "longitude"]).copy()

    # 4. Standardise text columns
    for col in ["commodity", "market", "admin1", "admin2", "category", "unit"]:
        if col in df.columns:
            df.loc[:, col] = df[col].astype(str).str.strip().str.title()

    # 5. Derived date columns
    df.loc[:, "year"]  = df["date"].dt.year
    df.loc[:, "month"] = df["date"].dt.month

    # 6. price_per_kg — normalise price to a per-KG basis
    kg_weights = df["unit"].apply(_parse_kg_from_unit)
    df.loc[:, "price_per_kg"] = df["price"] / kg_weights.where(kg_weights > 0)

    return df