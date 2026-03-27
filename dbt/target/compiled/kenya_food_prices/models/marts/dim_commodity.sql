-- dim_commodity: one row per unique commodity
SELECT DISTINCT
    commodity_id,
    commodity,
    category,
    unit
FROM "kenya_food_prices"."public"."stg_food_prices"