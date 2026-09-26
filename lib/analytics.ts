import type { Member, RiskAssessment, RiskBand } from "./data/types";

export const DAY_MS = 86_400_000;

/** Whole days between two dates (b later than a). */
export function daysBetween(a: string | Date, b: string | Date): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.max(0, Math.floor((db - da) / DAY_MS));
}

/**
 * Deterministic risk score for a member.
 *
 * Scoring (cumulative):
 *   +35  inactive more than 14 days
 *   +20  inactive more than 7 days (instead of the +35 tier — tiers don't stack)
 *   +30  one or more failed payments
 *   +15  tenure shorter than 30 days (new members are fragile)
 *   −20  tenure longer than 180 days (loyalty discount)
 *
 * Floor 0, clamp 0–100.
 */
export function riskScore(
  member: Member,
  now: Date = new Date()
): { score: number; band: RiskBand; reason: string } {
  const inactiveDays = daysBetween(member.lastActiveAt, now);
  const tenureDays = daysBetween(member.joinedAt, now);

  let score = 0;
  const reasons: string[] = [];

  if (inactiveDays > 14) {
    score += 35;
    reasons.push(`Inactive ${inactiveDays} days`);
  } else if (inactiveDays > 7) {
    score += 20;
    reasons.push(`Inactive ${inactiveDays} days`);
  }

  if (member.failedPayments > 0) {
    score += 30;
    reasons.push(
      member.failedPayments === 1
        ? "failed payment"
        : `${member.failedPayments} failed payments`
    );
  }

  if (tenureDays < 30) {
    score += 15;
    reasons.push("new member");
  } else if (tenureDays > 180) {
    score -= 20;
    reasons.push("long-term member");
  }

  score = Math.max(0, Math.min(100, score));

  const band: RiskBand = score >= 60 ? "critical" : score >= 35 ? "watch" : "healthy";

  return {
    score,
    band,
    reason: reasons.length > 0 ? reasons.join(" · ") : "Engaged recently",
  };
}

/** Score every member and return assessments. */
export function assessAll(
  members: Member[],
  now: Date = new Date()
): RiskAssessment[] {
  return members.map((member) => {
    const { score, band, reason } = riskScore(member, now);
    return {
      member,
      riskScore: score,
      band,
      reason,
      daysInactive: daysBetween(member.lastActiveAt, now),
      tenureDays: daysBetween(member.joinedAt, now),
    };
  });
}

/**
 * Churn rate over a period (percent).
 * churned = members whose status is cancelled and cancelled within the period.
 */
export function churnRate(
  membersAtStart: number,
  membersChurned: number
): number {
  if (membersAtStart <= 0) return 0;
  return (membersChurned / membersAtStart) * 100;
}

/**
 * Month-over-month delta in percent.
 * Returns 0 when previous is 0 (avoids division by zero).
 */
export function mrrDelta(currentCents: number, previousCents: number): number {
  if (previousCents <= 0) return currentCents > 0 ? 100 : 0;
  return ((currentCents - previousCents) / previousCents) * 100;
}
