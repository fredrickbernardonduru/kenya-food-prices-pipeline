import pandas as pd

def clean_data(df):
    """
    Cleans the food price dataframe.
    """
    # 1. Strip whitespace from column names and make them lowercase
    df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]

    # 2. Example: Remove rows with missing prices (adjust column name as needed)
    # df = df.dropna(subset=['price'])

    # 3. Drop duplicates
    df = df.drop_duplicates()

    print("Cleaning complete: Column names standardized and duplicates removed.")
    return df