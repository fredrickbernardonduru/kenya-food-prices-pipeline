
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select date
from "kenya_food_prices"."public"."raw_food_prices"
where date is null



  
  
      
    ) dbt_internal_test