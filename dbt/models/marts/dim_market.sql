-- dim_market: one row per unique market
SELECT DISTINCT
    market_id,
    market,
    county,
    sub_county,
    latitude,
    longitude
FROM {{ ref('stg_food_prices') }}