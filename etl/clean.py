import pandas as pd

def clean_data(df):

    # Convert date column
    df["date"] = pd.to_datetime(df["date"])

    # Remove rows missing geographic data
    df = df.dropna(subset=["admin1", "admin2", "latitude", "longitude"])

    # Standardize text columns
    df["commodity"] = df["commodity"].str.strip().str.title()
    df["market"] = df["market"].str.strip().str.title()
    df["admin1"] = df["admin1"].str.strip().str.title()
    df["admin2"] = df["admin2"].str.strip().str.title()

    # Create derived columns
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month

    return df