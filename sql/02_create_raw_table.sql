CREATE TABLE raw_food_prices (
    date DATE,
    admin1 VARCHAR(100),
    admin2 VARCHAR(100),
    market VARCHAR(100),
    market_id INT,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    category VARCHAR(100),
    commodity VARCHAR(100),
    commodity_id INT,
    unit VARCHAR(50),
    priceflag VARCHAR(20),
    pricetype VARCHAR(20),
    currency VARCHAR(10),
    price NUMERIC,
    usdprice NUMERIC
);
