import pandas as pd
from sqlalchemy import create_engine

# 1. Database Connection (Updated with your credentials)
# Format: "postgresql://username:password@localhost:port/database"
DB_URL = "postgresql://postgres:Huxtler41268690@localhost:5432/kenya_food_prices"
engine = create_engine(DB_URL)

# 2. Local File Path (Using the 'r' prefix for Windows paths)
CSV_PATH = r"C:\Users\Fredrich Bernard\Desktop\Training\Data Engineering\Everything Data\DataCamp\Project\kenya-food-prices-pipeline\data\sample_food_prices.csv"

def extract_data(path=CSV_PATH):
    print("Reading CSV...")
    return pd.read_csv(path)

def load_data(df, table_name):
    print(f"Loading data into table: {table_name}...")
    df.to_sql(
        table_name,
        engine,
        if_exists="replace",  # Use "replace" first to create the table structure
        index=False
    )
    print("Upload complete!")

# 3. Execution Block
if __name__ == "__main__":
    try:
        data = extract_data()
        load_data(data, "market_prices")
    except Exception as e:
        print(f"An error occurred: {e}")