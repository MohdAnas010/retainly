import Link from "next/link";
import MrrChart from "@/components/MrrChart";
import RetentionChart from "@/components/RetentionChart";
import StatCard from "@/components/StatCard";
import { getAdapter } from "@/lib/data/adapter";

function fmtMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtDelta(pct: number, suffix = ""): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}${suffix}`;
}

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const adapter = getAdapter();
  const data = await adapter.getOverview(companyId);
  const { kpis } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          How your membership business is retaining members — and where revenue
          is leaking.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monthly recurring revenue"
          value={fmtMoney(kpis.mrrCents)}
          delta={fmtDelta(kpis.mrrDeltaPct, "%")}
          deltaTone={kpis.mrrDeltaPct >= 0 ? "good" : "bad"}
          hint="vs. last month"
        />
        <StatCard
          label="Churn rate"
          value={`${kpis.churnRatePct.toFixed(1)}%`}
          delta={fmtDelta(kpis.churnDeltaPts, " pts")}
          deltaTone={kpis.churnDeltaPts <= 0 ? "good" : "bad"}
          hint="members lost this month"
        />
        <StatCard
          label="Active members"
          value={kpis.activeMembers.toLocaleString()}
          delta={fmtDelta(kpis.activeDeltaPct, "%")}
          deltaTone={kpis.activeDeltaPct >= 0 ? "good" : "bad"}
          hint="paying right now"
        />
        <StatCard
          label="Avg. member lifetime"
          value={`${kpis.avgRetentionDays} days`}
          delta={`+${kpis.retentionDeltaDays} days`}
          deltaTone="good"
          hint="across active members"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold">MRR trend</h2>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            Monthly recurring revenue, last 6 months
          </p>
          <MrrChart data={data.mrrTrend} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold">Cohort retention curve</h2>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            Share of a cohort still active, weeks 1–12
          </p>
          <RetentionChart data={data.retentionCurve} />
        </div>
      </div>

      <Link
        href={`/dashboard/${companyId}/at-risk`}
        className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-5 transition-colors hover:bg-amber-100/60 dark:border-amber-500/20 dark:bg-amber-500/10 dark:hover:bg-amber-500/15"
      >
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {data.atRiskCount} members are at risk of churning
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300/80">
            {data.criticalCount} critical — review the list and reach out before
            they cancel.
          </p>
        </div>
        <span className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white">
          View at-risk →
        </span>
      </Link>
    </div>
  );
}
