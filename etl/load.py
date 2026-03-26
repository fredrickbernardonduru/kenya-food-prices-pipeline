import pandas as pd
from sqlalchemy import create_engine
import os


# -------------------------
# DB CONFIG (use env vars ideally)
# -------------------------
DB_HOST = os.getenv("POSTGRES_HOST", "postgres")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "Huxtler41268690")
DB_NAME = os.getenv("POSTGRES_DB", "kenya_food_prices")


DB_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DB_URL)


# -------------------------
# LOAD FUNCTION
# -------------------------
def load_data(df: pd.DataFrame, table_name: str):
    print(f"🚀 Loading data into table: {table_name}...")

    try:
        df.to_sql(
            name=table_name,
            con=engine,          # IMPORTANT: pass engine directly
            if_exists="replace", # or "append"
            index=False,
            method="multi",      # faster inserts
            chunksize=1000
        )

        print(f"✅ Data successfully loaded into '{table_name}'")

    except Exception as e:
        print(f"❌ Failed to load data: {e}")
        raise


# -------------------------
# TEST
# -------------------------
if __name__ == "__main__":
    test_df = pd.DataFrame({"status": ["ok"]})
    load_data(test_df, "health_check")