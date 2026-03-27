# Kenya Food Prices — Production-Ready ETL Pipeline

**Project title:** Cleaned & Enriched Food Prices with Visualization Prep & Production-Ready ETL Pipeline  
**Dataset:** WFP Kenya Food Prices (~17,000 rows, 2006–2025, monthly)

---

## Architecture

```
CSV / URL
   │
   ▼
extract.py ──► clean.py ──► quality checks ──► load.py (psycopg2)
                                                    │
                                              PostgreSQL
                                           ┌────────────────┐
                                           │  raw_food_prices│
                                           │  dim_market     │
                                           │  dim_commodity  │
                                           │  dim_date       │
                                           │  fact_prices    │
                                           └────────────────┘
                                                    │
                                               dbt Core
                                           (stg → marts → agg)
                                                    │
                                          Grafana / Metabase
```

All orchestration runs inside Docker via **Apache Airflow 2.9.0**.

---

## Project Structure

```
kenya-food-prices-pipeline/
├── airflow/dags/
│   └── food_prices_dag.py       # 4-task DAG: extract→clean→load→verify
├── etl/
│   ├── extract.py               # Load CSV from disk (or URL)
│   ├── clean.py                 # Pandas cleaning + price_per_kg derivation
│   ├── pipeline.py              # Orchestrator with QC + incremental logic
│   └── load.py                  # psycopg2 bulk insert (bypasses to_sql)
├── sql/
│   ├── 02_create_raw_table.sql  # Raw staging table DDL
│   ├── 03_create_clean_tables.sql # Star schema DDL
│   └── analysis_queries.sql     # 8 analytical SQL queries
├── dbt/
│   ├── models/staging/          # stg_food_prices (view)
│   └── models/marts/            # dim_*, fact_prices, agg_monthly_prices
├── docker/
│   ├── docker-compose.yml
│   └── Dockerfile.airflow
└── data/
    └── sample_food_prices.csv
```

---

## Quick Start

```bash
cd docker
docker compose build --no-cache
docker compose up -d
# Open http://localhost:8080  (admin / admin)
# Trigger: kenya_food_prices_pipeline
```

To build the star schema after the ETL has run:
```bash
docker exec -it kenya_db psql -U postgres -d kenya_food_prices \
  -f /sql/03_create_clean_tables.sql
```

To run dbt (install dbt-postgres locally first):
```bash
cd dbt
dbt run
dbt test
```

---

## Data Issues Observed

1. **Missing geographic data** — ~3% of rows have null `latitude`/`longitude`; dropped in `clean.py`.
2. **Inconsistent commodity names** — e.g. "Maize", "Maize (white)", "Maize White" refer to similar items; standardised with `.str.title()` but not merged (would require domain knowledge).
3. **Mixed units** — prices are quoted per KG, per 50 KG bag, per 90 KG bag, etc., making direct comparison misleading. Resolved by deriving `price_per_kg`.
4. **Sparse recent data** — some markets have no observations after 2022, likely due to data collection gaps rather than markets closing.

---

## Design Choices

- **psycopg2 over pandas `to_sql`** — Airflow 2.9.0 locks SQLAlchemy to `<2.0`, which is incompatible with pandas 2.x on Python 3.12. Using `psycopg2` with `execute_values` sidesteps this entirely and is faster.
- **Incremental loads** — a watermark file tracks the last processed date; re-runs only insert new rows, not the full dataset.
- **Star schema** — `dim_date`, `dim_market`, `dim_commodity`, `fact_prices` follows Kimball conventions; `agg_monthly_prices` is a pre-aggregated mart for dashboard queries.
- **dbt for transformations** — raw → staging → marts separation keeps SQL testable and version-controlled.

---

## Grafana / Metabase Dashboard Queries

Connect your dashboard tool to PostgreSQL (`localhost:5432`, db `kenya_food_prices`) and use:

**Maize price trend (line chart):**
```sql
SELECT price_date, avg_price_kes
FROM agg_monthly_prices
WHERE commodity ILIKE '%maize%'
ORDER BY price_date;
```

**Average price by commodity (bar chart):**
```sql
SELECT commodity, ROUND(AVG(avg_price_kes),2) AS avg_price
FROM agg_monthly_prices
GROUP BY commodity
ORDER BY avg_price DESC
LIMIT 15;
```

**County heatmap data:**
```sql
SELECT county, commodity, ROUND(AVG(avg_price_kes),2) AS avg_price
FROM agg_monthly_prices
GROUP BY county, commodity
ORDER BY county, commodity;
```