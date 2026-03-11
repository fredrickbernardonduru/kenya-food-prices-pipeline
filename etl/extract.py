import pandas as pd

# Use a 'raw' string (r"...") to handle the backslashes in Windows paths
FILE_PATH = r"C:\Users\Fredrich Bernard\Desktop\Training\Data Engineering\Everything Data\DataCamp\Project\kenya-food-prices-pipeline\data\sample_food_prices.csv"

def extract_data(path=FILE_PATH):
    # pandas can read local files just as easily as URLs
    df = pd.read_csv(path)
    return df
