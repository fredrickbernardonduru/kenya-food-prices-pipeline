-- dim_commodity: one row per unique commodity_id
-- DISTINCT ON handles cases where same commodity_id appears with
-- slightly different unit/category values in the raw data
SELECT DISTINCT ON (commodity_id)
    commodity_id,
    commodity,
    category,
    unit
FROM "kenya_food_prices"."public"."stg_food_prices"
ORDER BY commodity_id, commodity