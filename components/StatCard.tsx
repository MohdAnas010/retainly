interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "good" | "bad" | "neutral";
  hint?: string;
}

export default function StatCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  hint,
}: StatCardProps) {
  const tone =
    deltaTone === "good"
      ? "bg-frosted-success/10 text-frosted-success"
      : deltaTone === "bad"
        ? "bg-frosted-error/10 text-frosted-error"
        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {delta && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>
            {delta}
          </span>
        )}
      </div>
      {hint && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}
