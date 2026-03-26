import pandas as pd
from sqlalchemy import create_engine
import os

# 1. Database Configuration
# We use 'postgres' because that is the SERVICE name in your docker-compose
DB_HOST = "postgres" 
DB_PORT = "5432"

# These should match your .env file or the defaults you used
DB_USER = "postgres"              
DB_PASS = "Huxtler41268690"       
DB_NAME = "kenya_food_prices"     

# Final Connection String
DB_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DB_URL)

def load_data(df, table_name):
    print(f"🚀 Connecting to {DB_HOST} to load table: {table_name}...")
    try:
        with engine.begin() as conn:
            df.to_sql(
                name=table_name,
                con=conn,
                if_exists='replace',
                index=False
            )
        print(f"✅ Success! Data loaded into '{table_name}'.")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        raise