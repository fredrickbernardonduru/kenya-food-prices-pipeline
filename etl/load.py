import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

# Database Configuration
DB_HOST = "postgres"
DB_PORT = 5432
DB_USER = "postgres"
DB_PASS = "Huxtler41268690"
DB_NAME = "kenya_food_prices"


def get_connection():
    """Create and return a raw psycopg2 connection."""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        dbname=DB_NAME,
    )


def load_data(df, table_name):
    """
    Loads a Pandas DataFrame into Postgres using psycopg2 directly.
    This bypasses pandas to_sql entirely, so it works with ANY version
    of pandas, SQLAlchemy, or Python without compatibility conflicts.
    """
    print(f"🚀 Loading {len(df)} rows into table: {table_name}...")

    try:
        conn = get_connection()
        cur = conn.cursor()

        # --- Drop and recreate the table to match the DataFrame schema ---
        columns = df.columns.tolist()

        # Map pandas dtypes to Postgres types
        dtype_map = {
            "int64": "BIGINT",
            "int32": "INTEGER",
            "float64": "DOUBLE PRECISION",
            "float32": "REAL",
            "bool": "BOOLEAN",
            "datetime64[ns]": "TIMESTAMP",
            "object": "TEXT",
        }

        col_defs = []
        for col in columns:
            pg_type = dtype_map.get(str(df[col].dtype), "TEXT")
            col_defs.append(f'"{col}" {pg_type}')

        cur.execute(f'DROP TABLE IF EXISTS "{table_name}"')
        cur.execute(f'CREATE TABLE "{table_name}" ({", ".join(col_defs)})')

        # --- Bulk insert using execute_values (very fast) ---
        # Replace NaN/NaT with None so psycopg2 writes NULL
        df = df.where(pd.notnull(df), None)
        rows = [tuple(row) for row in df.itertuples(index=False, name=None)]

        col_names = ", ".join(f'"{c}"' for c in columns)
        execute_values(
            cur,
            f'INSERT INTO "{table_name}" ({col_names}) VALUES %s',
            rows,
            page_size=1000,
        )

        conn.commit()
        cur.close()
        conn.close()
        print(f"✅ Success! {len(df)} rows loaded into '{table_name}'.")

    except Exception as e:
        print(f"❌ Load Failed: {e}")
        raise


if __name__ == "__main__":
    import pandas as pd
    test_df = pd.DataFrame(
        {"status": ["connection_test"], "timestamp": [pd.Timestamp.now()]}
    )
    load_data(test_df, "connection_health_check")