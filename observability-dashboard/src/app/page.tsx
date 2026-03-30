"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServiceStatus {
  status: string;
  latency?: number;
  error?: string;
  details?: Record<string, string | number>;
  lastRun?: { state: string; start_date: string; end_date: string };
  last_date?: string;
  days_old?: number;
}

interface HealthData {
  overall: string;
  checkedAt: string;
  services: {
    database: ServiceStatus;
    airflow: ServiceStatus;
    freshness: ServiceStatus;
  };
}

interface PipelineStats {
  success_count: string;
  failed_count: string;
  running_count: string;
  total_count: string;
  avg_duration: string;
}

interface DagRun {
  run_id: string;
  state: string;
  start_date: string;
  end_date: string;
  duration_seconds: number;
}

interface TaskRun {
  task_id: string;
  state: string;
  start_date: string;
  duration_seconds: number;
  try_number: number;
}

interface PipelineData {
  runs: DagRun[];
  tasks: TaskRun[];
  stats: PipelineStats;
}

interface RowCounts {
  raw_food_prices: string;
  fact_prices: string;
  dim_market: string;
  dim_commodity: string;
  dim_date: string;
  agg_monthly_prices: string;
}

interface Commodity {
  commodity: string;
  observations: string;
  avg_price: string;
}

interface TrendPoint {
  month: string;
  rows: string;
}

interface MetricsData {
  rowCounts: RowCounts;
  priceStats: {
    avg_price: string;
    min_price: string;
    max_price: string;
    unique_commodities: string;
    unique_markets: string;
    earliest_date: string;
    latest_date: string;
  };
  topCommodities: Commodity[];
  monthlyTrend: TrendPoint[];
}

interface LogEntry {
  timestamp: string;
  task: string;
  state: string;
  duration: number;
  message: string;
  runId: string;
}

interface LogData {
  logs: LogEntry[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  healthy:   "#00E5A0",
  unhealthy: "#FF4560",
  degraded:  "#FFB547",
  fresh:     "#00E5A0",
  stale:     "#FFB547",
  outdated:  "#FF4560",
  unknown:   "#7A8FA3",
  success:   "#00E5A0",
  failed:    "#FF4560",
  running:   "#3B82F6",
  no_runs:   "#FFB547",
};

const STATE_DOT: Record<string, string> = {
  success: "dot-green bg-green",
  failed:  "dot-red bg-red",
  running: "bg-blue animate-pulse",
  skipped: "bg-dim",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] || "#7A8FA3";
  const dot = status === "healthy" || status === "success" || status === "fresh"
    ? "dot-green"
    : status === "failed" || status === "unhealthy" || status === "outdated"
    ? "dot-red"
    : "dot-amber";

  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`inline-block w-2 h-2 rounded-full ${dot}`}
        style={{ background: color }}
      />
      <span
        className="text-xs font-mono uppercase tracking-widest"
        style={{ color }}
      >
        {status}
      </span>
    </span>
  );
}

function MetricCard({
  label, value, sub, accent, delay = 0,
}: {
  label: string; value: string | number; sub?: string; accent?: string; delay?: number;
}) {
  return (
    <div
      className="card-hover relative bg-surface border border-border rounded-lg p-4 overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Corner accent */}
      <div
        className="absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-full"
        style={{ background: accent || "#00E5A0" }}
      />
      <p className="text-sub text-xs font-mono uppercase tracking-widest mb-2">{label}</p>
      <p
        className="count-anim text-2xl font-bold font-mono"
        style={{ color: accent || "#E8EDF3" }}
      >
        {value}
      </p>
      {sub && <p className="text-dim text-xs mt-1 font-mono">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, tag }: { title: string; tag?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-5 rounded-full bg-green" />
      <h2 className="text-sm font-mono uppercase tracking-widest text-sub">{title}</h2>
      {tag && (
        <span className="ml-auto text-xs font-mono text-dim border border-border px-2 py-0.5 rounded">
          {tag}
        </span>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded px-3 py-2 text-xs font-mono">
      <p className="text-sub mb-1">{label}</p>
      <p className="text-green">{payload[0].value.toLocaleString()}</p>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [health,   setHealth]   = useState<HealthData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [metrics,  setMetrics]  = useState<MetricsData | null>(null);
  const [logs,     setLogs]     = useState<LogData | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [loading,  setLoading]  = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [h, p, m, l] = await Promise.all([
        fetch("/api/health").then((r) => r.json()),
        fetch("/api/pipeline").then((r) => r.json()),
        fetch("/api/metrics").then((r) => r.json()),
        fetch("/api/logs").then((r) => r.json()),
      ]);
      setHealth(h);
      setPipeline(p);
      setMetrics(m);
      setLogs(l);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchAll]);

  const stats = pipeline?.stats;
  const successRate = stats
    ? Math.round((parseInt(stats.success_count) / Math.max(parseInt(stats.total_count), 1)) * 100)
    : 0;

  const trendData = metrics?.monthlyTrend?.map((d) => ({
    month: d.month.slice(5), // "2024-03" → "03"
    rows: parseInt(d.rows),
  })) || [];

  const commodityData = metrics?.topCommodities?.map((c) => ({
    name: c.commodity.length > 14 ? c.commodity.slice(0, 13) + "…" : c.commodity,
    value: parseInt(c.observations),
  })) || [];

  return (
    <div className="relative min-h-screen z-10">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded border border-green/40 flex items-center justify-center">
              <div className="w-3 h-3 rounded-sm bg-green dot-green" />
            </div>
            <div>
              <span className="font-mono text-sm font-semibold text-text tracking-tight">
                KENYA PIPELINE OBSERVATORY
              </span>
              <span className="ml-3 text-xs font-mono text-dim">v1.0</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {health && (
              <StatusBadge status={health.overall} />
            )}
            <button
              onClick={fetchAll}
              className="text-xs font-mono text-sub hover:text-green transition-colors border border-border hover:border-green/40 px-3 py-1.5 rounded"
            >
              ↻ Refresh
            </button>
            <span className="text-xs font-mono text-dim">
              {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-green font-mono text-lg mb-2">
              Initializing<span className="cursor">_</span>
            </div>
            <div className="text-dim text-xs font-mono">Connecting to pipeline services…</div>
          </div>
        </div>
      ) : (
        <main className="max-w-screen-xl mx-auto px-6 py-8 space-y-8">

          {/* ── Row 1: Service Health ── */}
          <section>
            <SectionHeader title="Service Health" tag="live" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* PostgreSQL */}
              <div className="card-hover bg-surface border border-border rounded-lg p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-mono text-sub uppercase tracking-widest">PostgreSQL</p>
                    <p className="text-lg font-bold mt-1">Database</p>
                  </div>
                  <StatusBadge status={health?.services.database.status || "unknown"} />
                </div>
                {health?.services.database.details && (
                  <div className="space-y-1.5 mt-2">
                    {Object.entries(health.services.database.details).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs font-mono">
                        <span className="text-dim">{k}</span>
                        <span className="text-text">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {health?.services.database.latency !== undefined && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                    <span className="text-xs font-mono text-dim">latency</span>
                    <span className="text-xs font-mono text-green ml-auto">
                      {health.services.database.latency}ms
                    </span>
                  </div>
                )}
              </div>

              {/* Airflow */}
              <div className="card-hover bg-surface border border-border rounded-lg p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-mono text-sub uppercase tracking-widest">Airflow 2.9</p>
                    <p className="text-lg font-bold mt-1">Orchestrator</p>
                  </div>
                  <StatusBadge status={health?.services.airflow.status || "unknown"} />
                </div>
                {health?.services.airflow.lastRun && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-dim">last state</span>
                      <span style={{ color: STATUS_COLOR[health.services.airflow.lastRun.state] || "#7A8FA3" }}>
                        {health.services.airflow.lastRun.state}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-dim">last run</span>
                      <span className="text-text">
                        {new Date(health.services.airflow.lastRun.start_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                  <span className="text-dim">schedule</span>
                  <span className="text-text">@monthly</span>
                </div>
              </div>

              {/* Data Freshness */}
              <div className="card-hover bg-surface border border-border rounded-lg p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-mono text-sub uppercase tracking-widest">Data Freshness</p>
                    <p className="text-lg font-bold mt-1">ETL Output</p>
                  </div>
                  <StatusBadge status={health?.services.freshness.status || "unknown"} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-dim">last record date</span>
                    <span className="text-text">
                      {health?.services.freshness.last_date
                        ? new Date(health.services.freshness.last_date).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-dim">data age</span>
                    <span
                      style={{
                        color: STATUS_COLOR[health?.services.freshness.status || "unknown"],
                      }}
                    >
                      {health?.services.freshness.days_old != null
                        ? `${health.services.freshness.days_old} days`
                        : "—"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, ((health?.services.freshness.days_old || 0) / 90) * 100)}%`,
                        background: STATUS_COLOR[health?.services.freshness.status || "unknown"],
                      }}
                    />
                  </div>
                  <p className="text-dim text-xs font-mono mt-1">freshness threshold: 90 days</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Row 2: Pipeline KPIs ── */}
          <section>
            <SectionHeader title="Pipeline Performance" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricCard
                label="Total Runs"
                value={stats?.total_count || "—"}
                accent="#3B82F6"
                delay={0}
              />
              <MetricCard
                label="Successful"
                value={stats?.success_count || "—"}
                accent="#00E5A0"
                delay={60}
              />
              <MetricCard
                label="Failed"
                value={stats?.failed_count || "—"}
                accent="#FF4560"
                delay={120}
              />
              <MetricCard
                label="Success Rate"
                value={`${successRate}%`}
                accent={successRate >= 80 ? "#00E5A0" : "#FFB547"}
                sub={`${stats?.total_count || 0} total runs`}
                delay={180}
              />
              <MetricCard
                label="Avg Duration"
                value={
                  stats?.avg_duration
                    ? `${Math.round(parseFloat(stats.avg_duration))}s`
                    : "—"
                }
                accent="#A855F7"
                sub="per successful run"
                delay={240}
              />
            </div>
          </section>

          {/* ── Row 3: Data Volume ── */}
          <section>
            <SectionHeader title="Data Volume" tag="star schema" />
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {metrics?.rowCounts &&
                Object.entries(metrics.rowCounts).map(([table, count], i) => (
                  <div
                    key={table}
                    className="card-hover bg-surface border border-border rounded-lg p-3 text-center"
                  >
                    <p className="text-xl font-bold font-mono text-text">
                      {parseInt(count as string).toLocaleString()}
                    </p>
                    <p className="text-dim text-xs font-mono mt-1 truncate">{table}</p>
                    <div
                      className="w-full h-0.5 mt-2 rounded-full"
                      style={{
                        background: [
                          "#00E5A0", "#3B82F6", "#A855F7",
                          "#FFB547", "#FF4560", "#00E5A0",
                        ][i % 6],
                        opacity: 0.6,
                      }}
                    />
                  </div>
                ))}
            </div>
          </section>

          {/* ── Row 4: Charts ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly data trend */}
            <div className="bg-surface border border-border rounded-lg p-5">
              <SectionHeader title="Monthly Data Volume" tag="last 12 mo" />
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00E5A0" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00E5A0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: "#4A5A6B", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#4A5A6B", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="rows" stroke="#00E5A0" strokeWidth={2} fill="url(#greenGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Top commodities */}
            <div className="bg-surface border border-border rounded-lg p-5">
              <SectionHeader title="Top Commodities" tag="by observations" />
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={commodityData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fill: "#4A5A6B", fontSize: 9, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#4A5A6B", fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {commodityData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={["#00E5A0","#3B82F6","#A855F7","#FFB547","#FF4560","#00E5A0","#3B82F6","#A855F7"][i % 8]}
                        opacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── Row 5: Recent DAG Runs ── */}
          <section>
            <SectionHeader title="Recent DAG Runs" tag="kenya_food_prices_pipeline" />
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-dim uppercase tracking-widest">
                    <th className="text-left px-4 py-3">Run ID</th>
                    <th className="text-left px-4 py-3">State</th>
                    <th className="text-left px-4 py-3">Started</th>
                    <th className="text-left px-4 py-3">Duration</th>
                    <th className="text-left px-4 py-3">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {pipeline?.runs.slice(0, 8).map((run, i) => (
                    <tr
                      key={run.run_id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td className="px-4 py-3 text-sub truncate max-w-xs">{run.run_id.slice(-30)}</td>
                      <td className="px-4 py-3">
                        <span
                          className="flex items-center gap-1.5"
                          style={{ color: STATUS_COLOR[run.state] || "#7A8FA3" }}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${STATE_DOT[run.state] || "bg-dim"}`}
                          />
                          {run.state}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sub">
                        {run.start_date ? new Date(run.start_date).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-text">
                        {run.duration_seconds ? `${run.duration_seconds}s` : "—"}
                      </td>
                      <td className="px-4 py-3 text-dim">{(run as DagRun & { run_type?: string }).run_type || "manual"}</td>
                    </tr>
                  ))}
                  {!pipeline?.runs.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-dim">
                        No runs found. Trigger the DAG in Airflow first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Row 6: Task Timeline + Log Stream ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Task breakdown */}
            <div className="bg-surface border border-border rounded-lg p-5">
              <SectionHeader title="Task Breakdown" tag="last 20" />
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {pipeline?.tasks.slice(0, 20).map((task, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2 border-b border-border/40"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        STATE_DOT[task.state] || "bg-dim"
                      }`}
                    />
                    <span className="text-xs font-mono text-text w-36 truncate">
                      {task.task_id}
                    </span>
                    <span
                      className="text-xs font-mono ml-auto"
                      style={{ color: STATUS_COLOR[task.state] || "#7A8FA3" }}
                    >
                      {task.state}
                    </span>
                    <span className="text-xs font-mono text-dim w-12 text-right">
                      {task.duration_seconds ? `${task.duration_seconds}s` : "—"}
                    </span>
                  </div>
                ))}
                {!pipeline?.tasks.length && (
                  <p className="text-dim text-xs font-mono py-4 text-center">No task data yet.</p>
                )}
              </div>
            </div>

            {/* Log stream */}
            <div className="bg-surface border border-border rounded-lg p-5">
              <SectionHeader title="Log Stream" tag="live" />
              <div className="space-y-1.5 max-h-64 overflow-y-auto font-mono text-xs pr-1">
                {logs?.logs.slice(0, 20).map((log, i) => (
                  <div key={i} className="flex items-start gap-2 py-1">
                    <span className="text-dim flex-shrink-0">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleTimeString()
                        : "—"}
                    </span>
                    <span
                      className="flex-shrink-0"
                      style={{ color: STATUS_COLOR[log.state] || "#7A8FA3" }}
                    >
                      {log.state === "success"
                        ? "✓"
                        : log.state === "failed"
                        ? "✗"
                        : "▶"}
                    </span>
                    <span className="text-sub break-all">{log.message}</span>
                  </div>
                ))}
                {!logs?.logs.length && (
                  <p className="text-dim py-4 text-center">No logs yet.</p>
                )}
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-dim">$</span>
                  <span className="text-green cursor">_</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Footer ── */}
          <footer className="border-t border-border pt-6 pb-4 flex items-center justify-between text-xs font-mono text-dim">
            <span>Kenya Food Prices ETL · Observatory v1.0</span>
            <span>Auto-refresh: 30s · Last: {lastRefresh.toLocaleTimeString()}</span>
            <span>PostgreSQL · Airflow 2.9 · dbt Core</span>
          </footer>
        </main>
      )}
    </div>
  );
}