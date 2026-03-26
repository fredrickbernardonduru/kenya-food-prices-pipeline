import pandas as pd
from sqlalchemy import create_engine
import os

# 1. Database Configuration
# Using the service name 'postgres' as defined in your docker-compose
DB_HOST = "postgres" 
DB_PORT = "5432"
DB_USER = "postgres"              
DB_PASS = "Huxtler41268690"       
DB_NAME = "kenya_food_prices"     

# 2. Create the Connection URI
DB_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# 3. Create the SQLAlchemy 2.0 Engine
engine = create_engine(DB_URL)

def load_data(df, table_name):
    """
    Loads a Pandas DataFrame into the Postgres database.
    Using engine.begin() ensures a secure transaction in SQLAlchemy 2.0.
    """
    print(f"🚀 Preparing to load {len(df)} rows into table: {table_name}...")
    
    try:
        # 'with engine.begin()' automatically:
        # 1. Opens a connection
        # 2. Starts a transaction
        # 3. Commits if successful, or Rolls Back if it fails
        with engine.begin() as conn:
            df.to_sql(
                name=table_name,
                con=conn, 
                if_exists='replace',
                index=False,
                method='multi'  # This makes Postgres inserts much faster
            )
        print(f"✅ Success! Data fully loaded into '{table_name}'.")
        
    except Exception as e:
        print(f"❌ Load Failed: {e}")
        # We re-raise the error so Airflow marks the task as 'Failed'
        raise 

if __name__ == "__main__":
    # Local testing logic
    test_df = pd.DataFrame({'status': ['engine_begin_test'], 'timestamp': [pd.Timestamp.now()]})
    load_data(test_df, "connection_health_check")