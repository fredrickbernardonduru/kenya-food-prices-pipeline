-- fact_prices: grain-level price fact table
SELECT
    MD5(
        COALESCE(price_date::TEXT, '') || '-' ||
        COALESCE(market_id::TEXT, '')  || '-' ||
        COALESCE(commodity_id::TEXT, '') || '-' ||
        COALESCE(price_type, '')
    )                   AS price_id,
    price_date          AS date_id,
    market_id,
    commodity_id,
    price_kes,
    price_usd,
    price_type,
    price_flag,
    currency
FROM "kenya_food_prices"."public"."stg_food_prices"