"use client";

import { useMemo, useState } from "react";
import RiskBadge from "@/components/RiskBadge";
import type { RiskAssessment } from "@/lib/data/types";

type SortKey = "riskScore" | "daysInactive" | "tenureDays" | "mrrCents" | "name";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "—";
  return `${user.slice(0, 2)}•••@${domain}`;
}

const SORT_LABELS: Record<SortKey, string> = {
  riskScore: "Risk score",
  daysInactive: "Days inactive",
  tenureDays: "Tenure",
  mrrCents: "MRR",
  name: "Name",
};

export default function AtRiskTable({ items }: { items: RiskAssessment[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? items.filter(
          (a) =>
            a.member.name.toLowerCase().includes(q) ||
            a.member.email.toLowerCase().includes(q) ||
            a.member.plan.toLowerCase().includes(q)
        )
      : items;

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "riskScore":
          cmp = a.riskScore - b.riskScore;
          break;
        case "daysInactive":
          cmp = a.daysInactive - b.daysInactive;
          break;
        case "tenureDays":
          cmp = a.tenureDays - b.tenureDays;
          break;
        case "mrrCents":
          cmp = a.member.mrrCents - b.member.mrrCents;
          break;
        case "name":
          cmp = a.member.name.localeCompare(b.member.name);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [items, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  function th(label: string, key: SortKey, className = "") {
    return (
      <th className={`px-4 py-3 text-left ${className}`}>
        <button
          onClick={() => toggleSort(key)}
          className="inline-flex items-center gap-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {label}
          {sortKey === key && (
            <span aria-hidden>{sortDir === "asc" ? "▲" : "▼"}</span>
          )}
        </button>
      </th>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name, email, or plan…"
          className="w-full max-w-sm rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-72 dark:border-zinc-700 dark:bg-zinc-800 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
        />
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Sort:</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-800/40">
            <tr>
              {th("Member", "name")}
              {th("Plan", "mrrCents")}
              {th("Days inactive", "daysInactive")}
              {th("Tenure", "tenureDays")}
              {th("Risk", "riskScore")}
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                Reason
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr
                key={a.member.id}
                className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
                      {initials(a.member.name)}
                    </span>
                    <div>
                      <p className="font-medium">{a.member.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {maskEmail(a.member.email)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{a.member.plan}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    ${(a.member.mrrCents / 100).toFixed(0)}/mo
                  </p>
                </td>
                <td className="px-4 py-3 tabular-nums">{a.daysInactive}d</td>
                <td className="px-4 py-3 tabular-nums">{a.tenureDays}d</td>
                <td className="px-4 py-3">
                  <RiskBadge score={a.riskScore} band={a.band} />
                </td>
                <td className="max-w-[240px] px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                  {a.reason}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No members match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
