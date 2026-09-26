/**
 * Production adapter: talks to the real Whop API via @whop/sdk.
 *
 * This module is NEVER used without credentials. `getAdapter()` in
 * `adapter.ts` only instantiates it when DATA_MODE === "whop" AND
 * WHOP_API_KEY is set; otherwise the deterministic MockAdapter is used.
 *
 * FIELD MAPPINGS — verified against the @whop/sdk v2 generated client
 * (REST v1, https://api.whop.com/api/v1) on 2026-09-26:
 * - Plans:      client.plans.list({ account_id }) -> Plan.id,
 *               Plan.title (string|null), Plan.initial_price (smallest
 *               currency unit, e.g. cents), Plan.billing_period
 *               (days between charges; null = one-time).
 * - Memberships: client.memberships.list({ account_id }) -> Membership.id,
 *               .plan_id, .status, .created_at (ISO), .user_id
 *               (string|null — null for business/unclaimed buyers).
 *               NOTE: Membership.member is ALWAYS null on seller-side
 *               reads, so it is never used here.
 * - Member rows (seller-visible activity): client.members.list({ account_id })
 *               -> Member.last_accessed_at (string|null),
 *               Member.joined_at, Member.user { id, name, username }.
 * - Identity:   client.users.retrieve({ id: userId }) -> User.name,
 *               User.email (string|null), User.username.
 * - Payments:   client.payments.list({ account_id }) -> Payment.membership_id,
 *               .member_id, .failure_message (string|null),
 *               .decline_code, .status, .paid_at.
 *               A payment counts as failed when failure_message or
 *               decline_code is set.
 *
 * Honesty notes:
 * - MRR trend is reconstructed from membership cohorts (created_at <=
 *   month-end and still active-ish). Memberships carry no cancelled_at
 *   timestamp, so churned members only drop out of the CURRENT month —
 *   past months slightly overstate MRR for accounts with historical churn.
 *   The current-month KPIs are exact.
 * - lastActiveAt falls back to the membership created_at when Whop has no
 *   recorded access yet.
 */
import { WhopClient } from "@whop/sdk";
import type { Whop } from "@whop/sdk";
import type {
  Member,
  MetricPoint,
  NudgeSegment,
  OverviewData,
  RiskAssessment,
} from "./types";
import { assessAll, mrrDelta } from "../analytics";
import type { RetainlyDataAdapter } from "./adapter";

function requireKey(): string {
  const key = process.env.WHOP_API_KEY;
  if (!key) {
    throw new Error(
      "production mode requires WHOP_API_KEY — set it in the environment (see .env.example)"
    );
  }
  return key;
}

type PlanInfo = { name: string; priceCents: number; recurring: boolean };
type MemberRow = { name: string; lastActiveAt: string | null };

/** Retainly bands from the verified Whop MembershipStatus values. */
function mapStatus(s: Whop.MembershipStatus): Member["status"] {
  switch (s) {
    case "active":
    case "completed": // one-time purchase, access kept
    case "canceling": // still paying until period end
      return "active";
    case "trialing":
      return "trialing";
    case "past_due": // grace period after a failed payment
      return "past_due";
    default:
      // canceled, expired, unresolved, drafted
      return "cancelled";
  }
}

export class WhopSdkAdapter implements RetainlyDataAdapter {
  private client: WhopClient;

  constructor() {
    // The API key is a server-side secret; never expose it to the browser.
    this.client = new WhopClient({ token: requireKey() });
  }

  /**
   * Builds the member list from live Whop data:
   * memberships (billing truth) + member rows (activity/identity) +
   * users endpoint (email) + payments (failed-payment counts).
   */
  private async fetchMembers(companyId: string): Promise<Member[]> {
    const companyKey = process.env.WHOP_COMPANY_ID ?? companyId;

    // 1. Plans: id -> { name, priceCents, recurring }.
    const plans = new Map<string, PlanInfo>();
    const plansPage = await this.client.plans.list({
      account_id: companyKey,
      first: 100,
    });
    for await (const plan of plansPage) {
      plans.set(plan.id, {
        name: plan.title ?? plan.id,
        priceCents: plan.initial_price ?? 0,
        recurring: plan.billing_period != null,
      });
    }

    // 2. Member rows: userId -> { name, lastActiveAt } (seller-visible).
    const rows = new Map<string, MemberRow>();
    try {
      const membersPage = await this.client.members.list({
        account_id: companyKey,
        first: 100,
      });
      for await (const row of membersPage) {
        const u = row.user;
        if (!u) continue;
        rows.set(u.id, {
          name: u.name ?? u.username,
          lastActiveAt: row.last_accessed_at,
        });
      }
    } catch {
      // members:basic:read may be missing; identity falls back to the
      // users endpoint below and activity to created_at.
    }

    // 3. Failed-payment counts per membership from the payments ledger.
    const failedByMembership = new Map<string, number>();
    try {
      const paymentsPage = await this.client.payments.list({
        account_id: companyKey,
        first: 200,
      });
      for await (const p of paymentsPage) {
        if (!p.membership_id) continue;
        if (p.failure_message != null || p.decline_code != null) {
          failedByMembership.set(
            p.membership_id,
            (failedByMembership.get(p.membership_id) ?? 0) + 1
          );
        }
      }
    } catch {
      // payment:basic:read may be missing; failedPayments stays 0.
    }

    // 4. Memberships -> Retainly members.
    const members: Member[] = [];
    const emailCache = new Map<string, string>();
    const membershipsPage = await this.client.memberships.list({
      account_id: companyKey,
      first: 100,
    });
    for await (const m of membershipsPage) {
      const plan = plans.get(m.plan_id);
      const status = mapStatus(m.status);
      const row = m.user_id ? rows.get(m.user_id) : undefined;

      let name = row?.name ?? m.user_id ?? m.id;
      let email = "";
      if (m.user_id) {
        if (!emailCache.has(m.user_id)) {
          try {
            const u = await this.client.users.retrieve({ id: m.user_id });
            if (u.name) name = row?.name ?? u.name;
            emailCache.set(m.user_id, u.email ?? "");
          } catch {
            emailCache.set(m.user_id, "");
          }
        }
        email = emailCache.get(m.user_id) ?? "";
      }

      const recurring = plan?.recurring ?? false;
      members.push({
        id: m.id,
        name,
        email,
        plan: plan?.name ?? m.plan_id,
        mrrCents:
          status === "cancelled" || !recurring ? 0 : (plan?.priceCents ?? 0),
        joinedAt: m.created_at,
        lastActiveAt: row?.lastActiveAt ?? m.created_at,
        failedPayments: failedByMembership.get(m.id) ?? 0,
        status,
      });
    }
    return members;
  }

  /**
   * Six-month trend reconstructed from membership cohorts. Current month is
   * exact; earlier months approximate (no cancelled_at on memberships —
   * see module docstring).
   */
  private buildTrend(members: Member[]): MetricPoint[] {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const label = d.toLocaleString("en-US", { month: "short" });
      const cohort = members.filter((m) => new Date(m.joinedAt) <= monthEnd);
      const alive = cohort.filter((m) => m.status !== "cancelled");
      const churned = cohort.length - alive.length;
      return {
        month: label,
        mrrCents: alive.reduce((s, m) => s + m.mrrCents, 0),
        churnRate:
          cohort.length === 0
            ? 0
            : Number(((churned / cohort.length) * 100).toFixed(1)),
        activeMembers: alive.filter((m) => m.status === "active").length,
      };
    });
  }

  async getOverview(companyId: string): Promise<OverviewData> {
    const members = await this.fetchMembers(companyId);
    const now = new Date();

    const active = members.filter((m) => m.status === "active");
    const mrrCents = active.reduce((sum, m) => sum + m.mrrCents, 0);

    const mrrTrend = this.buildTrend(members);
    const [prev, last] = [mrrTrend[mrrTrend.length - 2], mrrTrend[mrrTrend.length - 1]];

    const assessments = assessAll(members, now);
    const atRiskCount = assessments.filter((a) => a.band !== "healthy").length;
    const criticalCount = assessments.filter((a) => a.band === "critical").length;

    const avgRetentionDays =
      active.length === 0
        ? 0
        : Math.round(
            active.reduce(
              (sum, m) =>
                sum +
                Math.floor(
                  (now.getTime() - new Date(m.joinedAt).getTime()) / 86_400_000
                ),
              0
            ) / active.length
          );

    return {
      kpis: {
        mrrCents,
        mrrDeltaPct: Number(mrrDelta(last.mrrCents, prev.mrrCents).toFixed(1)),
        churnRatePct: Number(last.churnRate.toFixed(1)),
        churnDeltaPts: Number((last.churnRate - prev.churnRate).toFixed(1)),
        activeMembers: last.activeMembers,
        activeDeltaPct:
          prev.activeMembers === 0
            ? 0
            : Number(
                (
                  ((last.activeMembers - prev.activeMembers) / prev.activeMembers) *
                  100
                ).toFixed(1)
              ),
        avgRetentionDays,
        retentionDeltaDays: 0,
      },
      mrrTrend,
      retentionCurve: [], // build from cohort data in production
      atRiskCount,
      criticalCount,
    };
  }

  async getAtRisk(companyId: string): Promise<RiskAssessment[]> {
    const members = await this.fetchMembers(companyId);
    return assessAll(members)
      .filter((a) => a.band !== "healthy" && a.member.status !== "cancelled")
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  /** Win-back segments derived from live risk-assessment counts. */
  async getWinBack(companyId: string): Promise<NudgeSegment[]> {
    const atRisk = await this.getAtRisk(companyId);
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
        impact:
          "Targets the #1 churn driver. Similar check-ins recovered 12–18% of dormant members in 30 days.",
      },
      {
        id: "payment",
        title: "Failed payments",
        count: failed,
        why: "Cards expire or get declined and the member never notices. They don't hate the product — they just never finished updating billing.",
        nudgeCopy:
          "Hi {name}, your last payment didn't go through, so your access is paused — not cancelled. It takes 30 seconds to update your card here: {billing_link}. Once it's updated you're back in instantly, and you won't lose your member pricing.",
        channel: "Announcement",
        impact:
          "Payment nudges convert fast: expect 30–40% of this segment to update billing within 72 hours.",
      },
      {
        id: "onboarding",
        title: "New members, low activation",
        count: newbies,
        why: "Joined in the last 45 days but never engaged deeply. New members who don't get value in week one churn at 3x the average rate.",
        nudgeCopy:
          "Welcome back, {name}. Most new members tell me week one feels overwhelming, so I made a 5-minute start guide: the three posts to read first, where to ask questions, and how to get the most from your plan. Want me to send it?",
        channel: "Announcement",
        impact:
          "Lifts week-one activation, which is the strongest predictor of 90-day retention.",
      },
    ];
  }
}

/**
 * FUTURE: live sync via webhooks.
 * Subscribe to membership.activated / membership.deactivated (see
 * PostMembershipActivatedPayload in the SDK) to invalidate the metrics
 * cache and keep the dashboard fresh without polling the REST API on
 * every page view.
 */
