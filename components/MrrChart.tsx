"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MetricPoint } from "@/lib/data/types";

function cssVar(name: string): string {
  if (typeof window === "undefined") return "#6366f1";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#6366f1";
}

export default function MrrChart({ data }: { data: MetricPoint[] }) {
  const rows = data.map((d) => ({ month: d.month, mrr: d.mrrCents / 100 }));
  // Read CSS variables at render; re-evaluate on theme change via key below.
  const stroke = cssVar("--chart-mrr");
  const grid = cssVar("--chart-grid");
  const tick = cssVar("--chart-tick");

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: tick, fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: tick, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
          width={56}
        />
        <Tooltip
          formatter={(v) => [`$${Number(v).toLocaleString()}`, "MRR"]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--chart-grid)",
            background: "Canvas",
            color: "CanvasText",
          }}
        />
        <Area type="monotone" dataKey="mrr" stroke={stroke} strokeWidth={2.5} fill="url(#mrrFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
