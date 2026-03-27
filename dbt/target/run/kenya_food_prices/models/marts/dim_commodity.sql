
  
    

  create  table "kenya_food_prices"."public"."dim_commodity__dbt_tmp"
  
  
    as
  
  (
    -- dim_commodity: one row per unique commodity
SELECT DISTINCT
    commodity_id,
    commodity,
    category,
    unit
FROM "kenya_food_prices"."public"."stg_food_prices"
  );
  