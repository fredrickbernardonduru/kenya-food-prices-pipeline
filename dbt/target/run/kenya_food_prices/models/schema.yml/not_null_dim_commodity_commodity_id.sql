
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select commodity_id
from "kenya_food_prices"."public"."dim_commodity"
where commodity_id is null



  
  
      
    ) dbt_internal_test