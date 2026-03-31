// FILE LOCATION: observability-dashboard/src/app/api/pipeline/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
    const runsResult = await pool.query(`
      SELECT
        dr.run_id,
        dr.dag_id,
        dr.state,
        dr.start_date,
        dr.end_date,
        EXTRACT(EPOCH FROM (COALESCE(dr.end_date, NOW()) - dr.start_date))::INT AS duration_seconds,
        dr.run_type,
        dr.conf
      FROM dag_run dr
      WHERE dr.dag_id = 'kenya_food_prices_pipeline'
      ORDER BY dr.start_date DESC
      LIMIT 20
    `);

    const taskResult = await pool.query(`
      SELECT
        ti.run_id,
        ti.task_id,
        ti.state,
        ti.start_date,
        ti.end_date,
        EXTRACT(EPOCH FROM (COALESCE(ti.end_date, NOW()) - ti.start_date))::INT AS duration_seconds,
        ti.try_number
      FROM task_instance ti
      WHERE ti.dag_id = 'kenya_food_prices_pipeline'
      ORDER BY ti.start_date DESC
      LIMIT 50
    `);

    // Success rate calculation
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE state = 'success') AS success_count,
        COUNT(*) FILTER (WHERE state = 'failed')  AS failed_count,
        COUNT(*) FILTER (WHERE state = 'running') AS running_count,
        COUNT(*) AS total_count,
        AVG(EXTRACT(EPOCH FROM (end_date - start_date))) FILTER (WHERE state = 'success') AS avg_duration
      FROM dag_run
      WHERE dag_id = 'kenya_food_prices_pipeline'
    `);

    return NextResponse.json({
      runs: runsResult.rows,
      tasks: taskResult.rows,
      stats: statsResult.rows[0],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}