import pandas as pd
from sqlalchemy import create_engine
import os

# 1. Database Configuration
DB_HOST = "postgres" 
DB_PORT = "5432"
DB_USER = "postgres"              
DB_PASS = "Huxtler41268690"       
DB_NAME = "kenya_food_prices"     

DB_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DB_URL)

def load_data(df, table_name):
    print(f"🚀 Connecting to {DB_HOST} to load table: {table_name}...")
    try:
        # Instead of 'begin()', we use the engine directly but 
        # ensure we are using the 'raw' connection which Pandas loves.
        with engine.connect() as conn:
            df.to_sql(
                name=table_name,
                con=conn, # This works better with certain Pandas versions
                if_exists='replace',
                index=False
            )
        print(f"✅ Success! Data loaded into '{table_name}'.")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        # If the above fails, try the absolute simplest version:
        print("🔄 Attempting fallback connection...")
        df.to_sql(name=table_name, con=engine, if_exists='replace', index=False)
        print("✅ Success via fallback!")

if __name__ == "__main__":
    load_data(pd.DataFrame({'status': ['ready']}), "health_check")