-- fact_prices: grain-level price fact table
SELECT
    {{ dbt_utils.generate_surrogate_key(['price_date', 'market_id', 'commodity_id', 'price_type']) }} AS price_id,
    price_date      AS date_id,
    market_id,
    commodity_id,
    price_kes,
    price_usd,
    price_per_kg,
    price_type,
    price_flag,
    currency
FROM {{ ref('stg_food_prices') }}