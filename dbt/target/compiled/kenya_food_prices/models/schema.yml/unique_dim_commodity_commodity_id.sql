
    
    

select
    commodity_id as unique_field,
    count(*) as n_records

from "kenya_food_prices"."public"."dim_commodity"
where commodity_id is not null
group by commodity_id
having count(*) > 1


