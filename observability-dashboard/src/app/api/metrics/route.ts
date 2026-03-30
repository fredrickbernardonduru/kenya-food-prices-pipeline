// FILE LOCATION: observability-dashboard/src/app/api/metrics/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
      // Table row counts
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM raw_food_prices)   AS raw_food_prices,
          (SELECT COUNT(*) FROM fact_prices)        AS fact_prices,
          (SELECT COUNT(*) FROM dim_market)         AS dim_market,
          (SELECT COUNT(*) FROM dim_commodity)      AS dim_commodity,
          (SELECT COUNT(*) FROM dim_date)           AS dim_date,
          (SELECT COUNT(*) FROM agg_monthly_prices) AS agg_monthly_prices
      `),

      // Price statistics from raw data
      pool.query(`
        SELECT
          ROUND(AVG(price)::NUMERIC, 2)   AS avg_price,
          ROUND(MIN(price)::NUMERIC, 2)   AS min_price,
          ROUND(MAX(price)::NUMERIC, 2)   AS max_price,
          ROUND(STDDEV(price)::NUMERIC, 2) AS stddev_price,
          COUNT(DISTINCT commodity)        AS unique_commodities,
          COUNT(DISTINCT market)           AS unique_markets,
          MIN(date)::TEXT                  AS earliest_date,
          MAX(date)::TEXT                  AS latest_date
        FROM raw_food_prices
        WHERE price > 0
      `),

      // Top 8 commodities by observation count
      pool.query(`
        SELECT commodity, COUNT(*) AS observations,
               ROUND(AVG(price)::NUMERIC, 2) AS avg_price
        FROM raw_food_prices
        GROUP BY commodity
        ORDER BY observations DESC
        LIMIT 8
      `),

      // Monthly row ingestion trend (last 12 months of data)
      pool.query(`
        SELECT
          TO_CHAR(date, 'YYYY-MM') AS month,
          COUNT(*) AS rows
        FROM raw_food_prices
        WHERE date >= (SELECT MAX(date) - INTERVAL '12 months' FROM raw_food_prices)
        GROUP BY TO_CHAR(date, 'YYYY-MM')
        ORDER BY month
      `),
    ]);

    return NextResponse.json({
      rowCounts: rowCounts.rows[0],
      priceStats: priceStats.rows[0],
      topCommodities: topCommodities.rows,
      monthlyTrend: monthlyTrend.rows,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}