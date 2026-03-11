from extract import extract_data
from clean import clean_data
from load import load_data

def run_pipeline():

    df = extract_data()

    df_clean = clean_data(df)

    load_data(df_clean, "raw_food_prices")


if __name__ == "__main__":
    run_pipeline()