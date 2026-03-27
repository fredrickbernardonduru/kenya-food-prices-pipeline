-- dim_commodity: one row per unique commodity
SELECT DISTINCT
    commodity_id,
    commodity,
    category,
    unit
FROM {{ ref('stg_food_prices') }}