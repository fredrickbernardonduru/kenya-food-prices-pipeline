import pandas as pd

# This is the path INSIDE the Docker container as mapped in your docker-compose volumes
FILE_PATH = "/opt/airflow/data/sample_food_prices.csv"

def extract_data(path=FILE_PATH):
    # pandas will now find the file in the shared Docker volume
    df = pd.read_csv(path)
    return df