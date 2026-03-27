
  
    

  create  table "kenya_food_prices"."public"."dim_market__dbt_tmp"
  
  
    as
  
  (
    -- dim_market: one row per unique market
SELECT DISTINCT
    market_id,
    market,
    county,
    sub_county,
    latitude,
    longitude
FROM "kenya_food_prices"."public"."stg_food_prices"
  );
  