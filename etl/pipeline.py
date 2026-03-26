from etl.extract import extract_data
from etl.clean import clean_data
from etl.load import load_data

def run_pipeline():

    df = extract_data()

    df_clean = clean_data(df)

    load_data(df_clean, "raw_food_prices")


if __name__ == "__main__":
    run_pipeline()