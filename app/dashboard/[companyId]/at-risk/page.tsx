import AtRiskTable from "@/components/AtRiskTable";
import { getAdapter } from "@/lib/data/adapter";

const CHIP_STYLES = {
  critical:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300",
  watch:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
  healthy:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
};

export default async function AtRiskPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const adapter = getAdapter();
  const items = await adapter.getAtRisk(companyId);

  const critical = items.filter((a) => a.band === "critical").length;
  const watch = items.filter((a) => a.band === "watch").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">At-risk members</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Members showing churn signals, ranked by risk score. Scores update as
          engagement and billing data changes.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <span className={`rounded-xl border px-4 py-2 text-sm font-semibold ${CHIP_STYLES.critical}`}>
          {critical} critical
        </span>
        <span className={`rounded-xl border px-4 py-2 text-sm font-semibold ${CHIP_STYLES.watch}`}>
          {watch} watch
        </span>
        <span className={`rounded-xl border px-4 py-2 text-sm font-semibold ${CHIP_STYLES.healthy}`}>
          {items.length} total at risk
        </span>
      </div>

      <AtRiskTable items={items} />
    </div>
  );
}
