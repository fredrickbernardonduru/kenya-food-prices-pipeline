SELECT commodity,
       AVG(price) AS avg_price
FROM raw_food_prices
GROUP BY commodity
ORDER BY avg_price DESC;