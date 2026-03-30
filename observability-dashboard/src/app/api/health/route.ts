// FILE LOCATION: observability-dashboard/src/app/api/health/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

async function checkDatabase() {
  const start = Date.now();
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM raw_food_prices)   AS raw_rows,
        (SELECT COUNT(*) FROM fact_prices)        AS fact_rows,
        (SELECT COUNT(*) FROM agg_monthly_prices) AS agg_rows,
        (SELECT MAX(date) FROM raw_food_prices)   AS last_date
    `);
    return {
      status: "healthy",
      latency: Date.now() - start,
      details: result.rows[0],
    };
  } catch (err: unknown) {
    return {
      status: "unhealthy",
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkAirflow() {
  const start = Date.now();
  try {
    const result = await pool.query(`
      SELECT state, start_date, end_date
      FROM dag_run
      WHERE dag_id = 'kenya_food_prices_pipeline'
      ORDER BY start_date DESC
      LIMIT 1
    `);
    const lastRun = result.rows[0];
    return {
      status: lastRun ? "healthy" : "no_runs",
      latency: Date.now() - start,
      lastRun,
    };
  } catch (err: unknown) {
    return {
      status: "unhealthy",
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkDataFreshness() {
  try {
    const result = await pool.query(`
      SELECT
        MAX(date)::TEXT AS last_date,
        NOW()::TEXT     AS checked_at,
        EXTRACT(DAY FROM (NOW() - MAX(date)))::INT AS days_old
      FROM raw_food_prices
    `);
    const { days_old } = result.rows[0];
    return {
      status: days_old < 45 ? "fresh" : days_old < 90 ? "stale" : "outdated",
      ...result.rows[0],
    };
  } catch {
    return { status: "unknown", last_date: null, days_old: null };
  }
}

export async function GET() {
  const [database, airflow, freshness] = await Promise.all([
    checkDatabase(),
    checkAirflow(),
    checkDataFreshness(),
  ]);

  const allHealthy =
    database.status === "healthy" && airflow.status === "healthy";

  return NextResponse.json({
    overall: allHealthy ? "healthy" : "degraded",
    checkedAt: new Date().toISOString(),
    services: { database, airflow, freshness },
  });
}