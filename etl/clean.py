import pandas as pd

def clean_data(df):

    # Work on an explicit copy to avoid SettingWithCopyWarning
    df = df.copy()

    # Convert date column
    df["date"] = pd.to_datetime(df["date"])

    # Remove rows missing geographic data
    df = df.dropna(subset=["admin1", "admin2", "latitude", "longitude"]).copy()

    # Standardize text columns using .loc to avoid chained assignment warnings
    df.loc[:, "commodity"] = df["commodity"].str.strip().str.title()
    df.loc[:, "market"] = df["market"].str.strip().str.title()
    df.loc[:, "admin1"] = df["admin1"].str.strip().str.title()
    df.loc[:, "admin2"] = df["admin2"].str.strip().str.title()

    # Create derived columns
    df.loc[:, "year"] = df["date"].dt.year
    df.loc[:, "month"] = df["date"].dt.month

    return df