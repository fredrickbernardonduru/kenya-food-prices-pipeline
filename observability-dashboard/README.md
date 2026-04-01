# Kenya Pipeline Observatory

A real-time observability dashboard built with **Next.js 14** that monitors the Kenya Food Prices ETL pipeline.

## Features

- **Service Health** — live status for PostgreSQL, Airflow, and data freshness
- **Pipeline KPIs** — success rate, run count, average duration
- **Data Volume** — row counts for every table in the star schema
- **Charts** — monthly data trend (area) + top commodities (bar)
- **DAG Run History** — last 20 runs with state, duration, type
- **Task Breakdown** — per-task status from Airflow metadata
- **Log Stream** — real-time task log feed
- **Auto-refresh** — every 30 seconds

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Database | pg (node-postgres) |
| Language | TypeScript |

## Quick Start

### Option A — Run locally (development)

```bash
cd observability-dashboard
npm install
npm run dev
# Open http://localhost:3001
```

### Option B — Run in Docker alongside the pipeline

Add to your `docker/docker-compose.yml`:

```yaml
  observatory:
    build:
      context: ../observability-dashboard
      dockerfile: Dockerfile
    container_name: kenya_observatory
    ports:
      - "3001:3001"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=postgres
      - DB_PASSWORD=Huxtler41268690
      - DB_NAME=kenya_food_prices
    depends_on:
      - postgres
```

Then:
```bash
docker compose up -d
# Open http://localhost:3001
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `postgres` | DB username |
| `DB_PASSWORD` | `Huxtler41268690` | DB password |
| `DB_NAME` | `kenya_food_prices` | Database name |

## API Routes

| Route | Description |
|-------|-------------|
| `GET /api/health` | Service health + data freshness |
| `GET /api/pipeline` | DAG runs, task instances, stats |
| `GET /api/metrics` | Row counts, price stats, trends |
| `GET /api/logs` | Recent task log entries |