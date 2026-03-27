-- ============================================================
-- Kenya Food Prices — SQL Analysis Queries
-- ============================================================

-- 1. SELECT / WHERE / ORDER BY
--    Latest 20 wholesale maize prices, newest first
SELECT date, market, admin1, commodity, price, currency
FROM raw_food_prices
WHERE commodity ILIKE '%maize%'
  AND pricetype = 'Wholesale'
ORDER BY date DESC
LIMIT 20;

-- 2. Aggregate: AVG, MIN, MAX price per commodity
SELECT
    commodity,
    COUNT(*)            AS observations,
    ROUND(AVG(price)::NUMERIC, 2)  AS avg_price_kes,
    MIN(price)          AS min_price_kes,
    MAX(price)          AS max_price_kes
FROM raw_food_prices
GROUP BY commodity
ORDER BY avg_price_kes DESC;

-- 3. GROUP BY + HAVING: commodities sold in more than 10 distinct markets
SELECT
    commodity,
    COUNT(DISTINCT market) AS market_count,
    ROUND(AVG(price)::NUMERIC, 2) AS avg_price_kes
FROM raw_food_prices
GROUP BY commodity
HAVING COUNT(DISTINCT market) > 10
ORDER BY market_count DESC;

-- 4. Average price by county (admin1) and year
SELECT
    admin1                          AS county,
    EXTRACT(YEAR FROM date)::INT    AS year,
    ROUND(AVG(price)::NUMERIC, 2)  AS avg_price_kes,
    COUNT(*)                        AS observations
FROM raw_food_prices
GROUP BY admin1, EXTRACT(YEAR FROM date)
ORDER BY county, year;

-- 5. Date handling: data from the last 2 years only
SELECT date, admin1, market, commodity, price
FROM raw_food_prices
WHERE date >= (CURRENT_DATE - INTERVAL '2 years')
ORDER BY date DESC;

-- 6. Price trend for maize — monthly average across all markets
SELECT
    EXTRACT(YEAR  FROM date)::INT  AS year,
    EXTRACT(MONTH FROM date)::INT  AS month,
    ROUND(AVG(price)::NUMERIC, 2) AS avg_maize_price_kes
FROM raw_food_prices
WHERE commodity ILIKE '%maize%'
GROUP BY year, month
ORDER BY year, month;

-- 7. Markets with the highest average food prices (top 10)
SELECT
    market,
    admin1  AS county,
    ROUND(AVG(price)::NUMERIC, 2) AS avg_price_kes,
    COUNT(DISTINCT commodity)     AS commodities_tracked
FROM raw_food_prices
GROUP BY market, admin1
ORDER BY avg_price_kes DESC
LIMIT 10;

-- 8. Price comparison: Retail vs Wholesale per commodity
SELECT
    commodity,
    pricetype,
    ROUND(AVG(price)::NUMERIC, 2) AS avg_price_kes,
    COUNT(*)                       AS observations
FROM raw_food_prices
WHERE pricetype IN ('Retail', 'Wholesale')
GROUP BY commodity, pricetype
ORDER BY commodity, pricetype;