export type MemberStatus = "active" | "cancelled" | "past_due" | "trialing";

export interface Member {
  id: string;
  name: string;
  email: string;
  plan: string;
  mrrCents: number;
  joinedAt: string; // ISO date
  lastActiveAt: string; // ISO date
  failedPayments: number;
  status: MemberStatus;
}

export interface MetricPoint {
  month: string; // e.g. "Apr"
  mrrCents: number;
  churnRate: number; // percent, e.g. 4.2
  activeMembers: number;
}

export type RiskBand = "critical" | "watch" | "healthy";

export interface RiskAssessment {
  member: Member;
  riskScore: number; // 0–100
  band: RiskBand;
  reason: string;
  daysInactive: number;
  tenureDays: number;
}

export interface OverviewData {
  kpis: {
    mrrCents: number;
    mrrDeltaPct: number;
    churnRatePct: number;
    churnDeltaPts: number;
    activeMembers: number;
    activeDeltaPct: number;
    avgRetentionDays: number;
    retentionDeltaDays: number;
  };
  mrrTrend: MetricPoint[];
  retentionCurve: { week: number; pct: number }[];
  atRiskCount: number;
  criticalCount: number;
}

export type NudgeChannel = "Whop DM" | "Announcement";

export interface NudgeSegment {
  id: string;
  title: string;
  count: number;
  why: string;
  nudgeCopy: string;
  channel: NudgeChannel;
  impact: string;
}
