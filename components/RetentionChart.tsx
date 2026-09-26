"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export default function RetentionChart({
  data,
}: {
  data: { week: number; pct: number }[];
}) {
  const stroke = cssVar("--chart-retention", "#0ea5e9");
  const grid = cssVar("--chart-grid", "#e5e7eb");
  const tick = cssVar("--chart-tick", "#6b7280");

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fill: tick, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          label={{ value: "Week", position: "insideBottomRight", offset: -4, fill: tick, fontSize: 12 }}
        />
        <YAxis
          tick={{ fill: tick, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}%`}
          domain={[0, 100]}
          width={48}
        />
        <Tooltip
          formatter={(v) => [`${v}%`, "Retained"]}
          labelFormatter={(l) => `Week ${l}`}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--chart-grid)",
            background: "Canvas",
            color: "CanvasText",
          }}
        />
        <Line type="monotone" dataKey="pct" stroke={stroke} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
