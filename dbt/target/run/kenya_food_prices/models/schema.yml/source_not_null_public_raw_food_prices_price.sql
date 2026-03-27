
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select price
from "kenya_food_prices"."public"."raw_food_prices"
where price is null



  
  
      
    ) dbt_internal_test