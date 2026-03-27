-- stg_food_prices: clean view over raw_food_prices
-- Casts types, renames columns, filters obvious bad data
-- price_per_kg is derived here in dbt since it may not exist in raw table

SELECT
    date::DATE                              AS price_date,
    EXTRACT(YEAR  FROM date)::INT           AS year,
    EXTRACT(MONTH FROM date)::INT           AS month,
    EXTRACT(QUARTER FROM date)::INT         AS quarter,
    market_id::INT                          AS market_id,
    market,
    admin1                                  AS county,
    admin2                                  AS sub_county,
    latitude::NUMERIC(9,6)                  AS latitude,
    longitude::NUMERIC(9,6)                 AS longitude,
    commodity_id::INT                       AS commodity_id,
    commodity,
    category,
    unit,
    pricetype                               AS price_type,
    priceflag                               AS price_flag,
    currency,
    price::NUMERIC(12,4)                    AS price_kes,
    usdprice::NUMERIC(12,4)                 AS price_usd
FROM "kenya_food_prices"."public"."raw_food_prices"
WHERE price > 0
  AND date IS NOT NULL
  AND market_id IS NOT NULL
  AND commodity_id IS NOT NULL