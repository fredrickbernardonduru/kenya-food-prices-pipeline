
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    

select
    market_id as unique_field,
    count(*) as n_records

from "kenya_food_prices"."public"."dim_market"
where market_id is not null
group by market_id
having count(*) > 1



  
  
      
    ) dbt_internal_test