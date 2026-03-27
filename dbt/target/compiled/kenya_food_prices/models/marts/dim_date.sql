-- dim_date: one row per distinct month in the dataset
SELECT DISTINCT
    price_date      AS date_id,
    year,
    month,
    quarter,
    TO_CHAR(price_date, 'Month') AS month_name
FROM "kenya_food_prices"."public"."stg_food_prices"