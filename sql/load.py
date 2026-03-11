from sqlalchemy import create_engine

engine = create_engine(
    "postgresql://postgres:your_password@localhost:5432/kenya_food_prices"
)