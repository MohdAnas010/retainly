import { assessAll, mrrDelta } from "../analytics";
import type {
  Member,
  MetricPoint,
  NudgeSegment,
  OverviewData,
  RiskAssessment,
} from "./types";
import type { RetainlyDataAdapter } from "./adapter";

/**
 * Deterministic PRNG (mulberry32). Fixed seed => identical mock data on every
 * boot, which keeps demo screenshots stable and makes the build reproducible.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 20260926;
const NOW = new Date("2026-09-26T12:00:00.000Z");

const FIRST = [
  "Maya", "Liam", "Sofia", "Noah", "Ava", "Ethan", "Isabella", "Mason",
  "Olivia", "Lucas", "Amara", "Mateo", "Zoe", "Leo", "Ruby", "Owen",
  "Chloe", "Daniel", "Nina", "Felix", "Grace", "Henry", "Ivy", "Jack",
  "Kira", "Luca", "Mia", "Nathan", "Priya", "Quinn", "Ravi", "Sara",
];
const LAST = [
  "Carter", "Bennett", "Reyes", "Nguyen", "Khan", "Okafor", "Patel",
  "Garcia", "Kim", "Silva", "Rossi", "Haddad", "Ali", "Brooks",
  "Weber", "Fischer", "Lopez", "Sharma", "Dubois", "Moreau",
];

interface PlanDef {
  name: string;
  mrrCents: number;
  weight: number;
}

const PLANS: PlanDef[] = [
  { name: "Starter", mrrCents: 2900, weight: 0.55 },
  { name: "Pro", mrrCents: 7900, weight: 0.32 },
  { name: "Elite", mrrCents: 19900, weight: 0.13 },
];

function pickPlan(rand: () => number): PlanDef {
  const r = rand();
  let acc = 0;
  for (const p of PLANS) {
    acc += p.weight;
    if (r <= acc) return p;
  }
  return PLANS[PLANS.length - 1];
}

function daysAgoIso(rand: () => number, min: number, max: number, base: Date): string {
  const d = min + rand() * (max - min);
  return new Date(base.getTime() - d * 86_400_000).toISOString();
}

function buildMembers(): Member[] {
  const rand = mulberry32(SEED);
  const members: Member[] = [];
  const count = 184;

  for (let i = 0; i < count; i++) {
    const plan = pickPlan(rand);
    const first = FIRST[Math.floor(rand() * FIRST.length)];
    const last = LAST[Math.floor(rand() * LAST.length)];
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@example.com`;

    const joinedAt = daysAgoIso(rand, 10, 420, NOW);

    // Activity profile: most members active recently, a tail goes quiet.
    const activityRoll = rand();
    const inactiveDays =
      activityRoll < 0.62
        ? rand() * 4
        : activityRoll < 0.8
          ? 4 + rand() * 6
          : activityRoll < 0.92
            ? 10 + rand() * 10
            : 20 + rand() * 40;
    const lastActiveAt = new Date(
      NOW.getTime() - inactiveDays * 86_400_000
    ).toISOString();

    // Failed payments cluster on quiet members.
    const failRoll = rand();
    const failedPayments =
      inactiveDays > 10 ? (failRoll < 0.35 ? 1 + Math.floor(rand() * 2) : 0)
      : failRoll < 0.06 ? 1
      : 0;

    const status =
      failedPayments > 0 && inactiveDays > 25 ? "past_due"
      : inactiveDays > 45 ? "cancelled"
      : "active";

    members.push({
      id: `mem_${String(i + 1).padStart(3, "0")}`,
      name: `${first} ${last}`,
      email,
      plan: plan.name,
      mrrCents: status === "cancelled" ? 0 : plan.mrrCents,
      joinedAt,
      lastActiveAt,
      failedPayments,
      status,
    });
  }
  return members;
}

const MEMBERS = buildMembers();

function buildMrrTrend(): MetricPoint[] {
  const rand = mulberry32(SEED + 1);
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  // Base MRR grows from ~$11.4k to ~$14.1k over 6 months with small noise.
  const base = 1_142_000;
  const points: MetricPoint[] = [];
  for (let i = 0; i < months.length; i++) {
    const growth = 1 + i * 0.042;
    const noise = 1 + (rand() - 0.5) * 0.03;
    const mrrCents = Math.round(base * growth * noise);
    const churnRate = Number((5.8 - i * 0.28 + (rand() - 0.5) * 0.6).toFixed(1));
    const activeMembers = Math.round(168 * (1 + i * 0.023) + (rand() - 0.5) * 6);
    points.push({ month: months[i], mrrCents, churnRate, activeMembers });
  }
  return points;
}

function buildRetentionCurve(): { week: number; pct: number }[] {
  // Classic decay curve: fast early drop, long tail.
  const curve: { week: number; pct: number }[] = [];
  for (let w = 1; w <= 12; w++) {
    const pct = Number((100 * Math.exp(-w / 5.2) + 18 * Math.exp(-w / 28)).toFixed(1));
    curve.push({ week: w, pct: Math.min(100, pct) });
  }
  return curve;
}

const MRR_TREND = buildMrrTrend();
const RETENTION_CURVE = buildRetentionCurve();

function avgRetentionDays(): number {
  const active = MEMBERS.filter((m) => m.status === "active");
  if (active.length === 0) return 0;
  const total = active.reduce(
    (sum, m) =>
      sum + Math.floor((NOW.getTime() - new Date(m.joinedAt).getTime()) / 86_400_000),
    0
  );
  return Math.round(total / active.length);
}

export class MockAdapter implements RetainlyDataAdapter {
  async getOverview(): Promise<OverviewData> {
    const [prev, last] = [MRR_TREND[MRR_TREND.length - 2], MRR_TREND[MRR_TREND.length - 1]];
    const assessments = assessAll(MEMBERS, NOW);
    const atRiskCount = assessments.filter(
      (a) => a.band === "critical" || a.band === "watch"
    ).length;
    const criticalCount = assessments.filter((a) => a.band === "critical").length;

    return {
      kpis: {
        mrrCents: last.mrrCents,
        mrrDeltaPct: Number(mrrDelta(last.mrrCents, prev.mrrCents).toFixed(1)),
        churnRatePct: last.churnRate,
        churnDeltaPts: Number((last.churnRate - prev.churnRate).toFixed(1)),
        activeMembers: last.activeMembers,
        activeDeltaPct: Number(
          (((last.activeMembers - prev.activeMembers) / prev.activeMembers) * 100).toFixed(1)
        ),
        avgRetentionDays: avgRetentionDays(),
        retentionDeltaDays: 6,
      },
      mrrTrend: MRR_TREND,
      retentionCurve: RETENTION_CURVE,
      atRiskCount,
      criticalCount,
    };
  }

  async getAtRisk(): Promise<RiskAssessment[]> {
    // Only surface members that need attention; healthy members are noise here.
    return assessAll(MEMBERS, NOW)
      .filter((a) => a.band !== "healthy" && a.member.status !== "cancelled")
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  async getWinBack(): Promise<NudgeSegment[]> {
    const atRisk = await this.getAtRisk();
    const quiet = atRisk.filter((a) => a.daysInactive > 14).length;
    const failed = atRisk.filter((a) => a.member.failedPayments > 0).length;
    const newbies = atRisk.filter((a) => a.tenureDays < 45).length;

    return [
      {
        id: "dormant",
        title: "Dormant but paying",
        count: quiet,
        why: "Members keep the subscription but haven't opened the community in 14+ days. They churn within 30–60 days if no one reaches out.",
        nudgeCopy:
          "Hey {name} — quick check-in. A few members told me they missed the Elite-only drop last week, so I reopened it for 48 hours. Want me to save you a spot? Reply YES and I'll send the link.",
        channel: "Whop DM",
        impact: "Targets the #1 churn driver. Similar check-ins recovered 12–18% of dormant members in 30 days.",
      },
      {
        id: "payment",
        title: "Failed payments",
        count: failed,
        why: "Cards expire or get declined and the member never notices. They don't hate the product — they just never finished updating billing.",
        nudgeCopy:
          "Hi {name}, your last payment didn't go through, so your access is paused — not cancelled. It takes 30 seconds to update your card here: {billing_link}. Once it's updated you're back in instantly, and you won't lose your member pricing.",
        channel: "Whop DM",
        impact: "Payment nudges convert fast: expect 30–40% of this segment to update billing within 72 hours.",
      },
      {
        id: "onboarding",
        title: "New members, low activation",
        count: newbies,
        why: "Joined in the last 45 days but never engaged deeply. New members who don't get value in week one churn at 3x the average rate.",
        nudgeCopy:
          "Welcome back, {name}. Most new members tell me week one feels overwhelming, so I made a 5-minute start guide: the three posts to read first, where to ask questions, and how to get the most from your plan. Want me to send it?",
        channel: "Announcement",
        impact: "Lifts week-one activation, which is the strongest predictor of 90-day retention.",
      },
    ];
  }
}
