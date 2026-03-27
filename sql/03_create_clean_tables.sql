-- ============================================================
-- Star Schema — Dimension & Fact Tables
-- Run AFTER raw_food_prices has been loaded by the ETL pipeline
-- ============================================================

-- Dimension: Markets
DROP TABLE IF EXISTS dim_market CASCADE;
CREATE TABLE dim_market (
    market_id   INT PRIMARY KEY,
    market      VARCHAR(100),
    admin1      VARCHAR(100),   -- county / region
    admin2      VARCHAR(100),   -- sub-county
    latitude    DECIMAL(9,6),
    longitude   DECIMAL(9,6)
);

INSERT INTO dim_market (market_id, market, admin1, admin2, latitude, longitude)
SELECT DISTINCT
    market_id,
    market,
    admin1,
    admin2,
    latitude,
    longitude
FROM raw_food_prices
WHERE market_id IS NOT NULL
ON CONFLICT (market_id) DO NOTHING;

-- Dimension: Commodities
DROP TABLE IF EXISTS dim_commodity CASCADE;
CREATE TABLE dim_commodity (
    commodity_id INT PRIMARY KEY,
    commodity    VARCHAR(100),
    category     VARCHAR(100),
    unit         VARCHAR(50)
);

INSERT INTO dim_commodity (commodity_id, commodity, category, unit)
SELECT DISTINCT
    commodity_id,
    commodity,
    category,
    unit
FROM raw_food_prices
WHERE commodity_id IS NOT NULL
ON CONFLICT (commodity_id) DO NOTHING;

-- Dimension: Date (one row per month observed in the data)
DROP TABLE IF EXISTS dim_date CASCADE;
CREATE TABLE dim_date (
    date_id     DATE PRIMARY KEY,
    year        INT,
    month       INT,
    month_name  VARCHAR(20),
    quarter     INT
);

INSERT INTO dim_date (date_id, year, month, month_name, quarter)
SELECT DISTINCT
    date                                        AS date_id,
    EXTRACT(YEAR  FROM date)::INT               AS year,
    EXTRACT(MONTH FROM date)::INT               AS month,
    TO_CHAR(date, 'Month')                      AS month_name,
    EXTRACT(QUARTER FROM date)::INT             AS quarter
FROM raw_food_prices
ON CONFLICT (date_id) DO NOTHING;

-- Fact: Prices
DROP TABLE IF EXISTS fact_prices CASCADE;
CREATE TABLE fact_prices (
    id              SERIAL PRIMARY KEY,
    date_id         DATE        REFERENCES dim_date(date_id),
    market_id       INT         REFERENCES dim_market(market_id),
    commodity_id    INT         REFERENCES dim_commodity(commodity_id),
    price           NUMERIC(12,4),
    usdprice        NUMERIC(12,4),
    pricetype       VARCHAR(20),
    priceflag       VARCHAR(20),
    currency        VARCHAR(10)
);

INSERT INTO fact_prices
    (date_id, market_id, commodity_id, price, usdprice, pricetype, priceflag, currency)
SELECT
    date,
    market_id,
    commodity_id,
    price,
    usdprice,
    pricetype,
    priceflag,
    currency
FROM raw_food_prices
WHERE market_id IS NOT NULL
  AND commodity_id IS NOT NULL
  AND price IS NOT NULL;

-- Quick sanity check
SELECT
    (SELECT COUNT(*) FROM dim_market)    AS markets,
    (SELECT COUNT(*) FROM dim_commodity) AS commodities,
    (SELECT COUNT(*) FROM dim_date)      AS dates,
    (SELECT COUNT(*) FROM fact_prices)   AS fact_rows;