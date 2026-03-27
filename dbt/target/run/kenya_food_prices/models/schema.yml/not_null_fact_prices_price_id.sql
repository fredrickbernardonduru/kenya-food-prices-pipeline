
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select price_id
from "kenya_food_prices"."public"."fact_prices"
where price_id is null



  
  
      
    ) dbt_internal_test