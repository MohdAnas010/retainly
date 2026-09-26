import type { RiskBand } from "@/lib/data/types";

const STYLES: Record<RiskBand, string> = {
  critical:
    "bg-frosted-error/10 text-frosted-error ring-frosted-error/30",
  watch:
    "bg-frosted-warning/10 text-frosted-warning ring-frosted-warning/30",
  healthy:
    "bg-frosted-success/10 text-frosted-success ring-frosted-success/30",
};

export default function RiskBadge({
  score,
  band,
}: {
  score: number;
  band: RiskBand;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STYLES[band]}`}
    >
      <span className="tabular-nums">{score}</span>
      <span className="capitalize">{band}</span>
    </span>
  );
}
