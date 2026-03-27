-- agg_monthly_prices: monthly average price per commodity per county
-- Used directly by Grafana / Metabase dashboards
SELECT
    f.date_id,
    d.year,
    d.month,
    d.month_name,
    c.commodity,
    c.category,
    m.county,
    m.market,
    ROUND(AVG(f.price_kes), 2)  AS avg_price_kes,
    ROUND(AVG(f.price_usd), 4)  AS avg_price_usd,
    COUNT(*)                     AS observations
FROM {{ ref('fact_prices') }}  f
JOIN {{ ref('dim_date') }}      d ON d.date_id      = f.date_id
JOIN {{ ref('dim_commodity') }} c ON c.commodity_id = f.commodity_id
JOIN {{ ref('dim_market') }}    m ON m.market_id    = f.market_id
GROUP BY
    f.date_id, d.year, d.month, d.month_name,
    c.commodity, c.category, m.county, m.market