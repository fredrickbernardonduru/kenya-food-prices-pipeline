import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        ti.task_id,
        ti.run_id,
        ti.state,
        ti.start_date,
        ti.end_date,
        ti.try_number,
        dr.state AS dag_state,
        EXTRACT(EPOCH FROM (COALESCE(ti.end_date, NOW()) - ti.start_date))::INT AS duration_sec
      FROM task_instance ti
      JOIN dag_run dr ON dr.run_id = ti.run_id AND dr.dag_id = ti.dag_id
      WHERE ti.dag_id = 'kenya_food_prices_pipeline'
      ORDER BY ti.start_date DESC
      LIMIT 30
    `);

    // Build log-like entries
    const logs = result.rows.map((row) => ({
      timestamp: row.start_date,
      task: row.task_id,
      runId: row.run_id,
      state: row.state,
      duration: row.duration_sec,
      tryNumber: row.try_number,
      message: buildLogMessage(row),
    }));

    return NextResponse.json({ logs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildLogMessage(row: {
  state: string;
  task_id: string;
  duration_sec: number;
  try_number: number;
}) {
  const icons: Record<string, string> = {
    success: "✓",
    failed:  "✗",
    running: "▶",
    skipped: "—",
  };
  const icon = icons[row.state] || "?";
  if (row.state === "success")
    return `${icon} Task '${row.task_id}' completed in ${row.duration_sec}s`;
  if (row.state === "failed")
    return `${icon} Task '${row.task_id}' FAILED (attempt ${row.try_number})`;
  if (row.state === "running")
    return `${icon} Task '${row.task_id}' currently running...`;
  return `${icon} Task '${row.task_id}' — ${row.state}`;
}