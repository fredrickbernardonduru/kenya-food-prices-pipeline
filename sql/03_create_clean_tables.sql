CREATE TABLE dim_market (
    market_id INT PRIMARY KEY,
    market VARCHAR(100),
    admin1 VARCHAR(100),
    admin2 VARCHAR(100),
    latitude DECIMAL,
    longitude DECIMAL
);

CREATE TABLE dim_commodity (
    commodity_id INT PRIMARY KEY,
    commodity VARCHAR(100),
    category VARCHAR(100),
    unit VARCHAR(50)
);

CREATE TABLE dim_date (
    date_id DATE PRIMARY KEY,
    year INT,
    month INT
);

CREATE TABLE fact_prices (
    id SERIAL PRIMARY KEY,
    date_id DATE,
    market_id INT,
    commodity_id INT,
    price NUMERIC,
    usdprice NUMERIC,
    pricetype VARCHAR(20),

    FOREIGN KEY (date_id) REFERENCES dim_date(date_id),
    FOREIGN KEY (market_id) REFERENCES dim_market(market_id),
    FOREIGN KEY (commodity_id) REFERENCES dim_commodity(commodity_id)
);