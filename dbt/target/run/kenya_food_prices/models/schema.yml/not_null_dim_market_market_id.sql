
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select market_id
from "kenya_food_prices"."public"."dim_market"
where market_id is null



  
  
      
    ) dbt_internal_test