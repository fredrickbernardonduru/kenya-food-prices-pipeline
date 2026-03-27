
    
    

select
    price_id as unique_field,
    count(*) as n_records

from "kenya_food_prices"."public"."fact_prices"
where price_id is not null
group by price_id
having count(*) > 1


