# Retainly — Churn & Retention Analytics

Retainly is a dashboard for Whop creators: it shows **who's about to churn,
why, and what to say to win them back**. Three screens:

- **Overview** — MRR, churn rate, active members, avg. member lifetime KPIs;
  6-month MRR trend and 12-week cohort retention charts; an at-risk summary
  strip.
- **At-Risk Members** — sortable, filterable table of members showing churn
  signals: inactivity, failed payments, plan/MRR, and a 0–100 risk score.
- **Win-Back** — three ready-to-send outreach segments (dormant payers,
  failed payments, low-activation new members) with copyable nudge copy,
  channel, and expected impact.

It ships as a Next.js App Router app that will later be embedded as a Whop
**Dashboard view** app. Today it runs standalone on deterministic mock data;
production wiring is designed but not connected.

## Quickstart

```bash
cd ~/workspace/whop-apps/builds/retainly
npm install
npm run dev
```

Open http://localhost:3000 — it redirects to `/dashboard/demo`.

Production build + serve:

```bash
npm run build
npm start
```

## Data modes

| Mode | `DATA_MODE` | `WHOP_API_KEY` | Behavior |
|------|-------------|----------------|----------|
| Mock (default) | `mock` | empty | Deterministic seeded mock data (mulberry32, fixed seed). No network calls. |
| Production | `whop` | set | `WhopSdkAdapter` — live Whop API calls. |
| Fallback | `whop`, key missing | empty | Warns in server logs and uses mock data. |

Copy `.env.example` to `.env.local` and fill values when you're ready for
production. Never commit real keys.

## Project structure

```
app/
  layout.tsx                 Root layout, next-themes ThemeProvider
  page.tsx                   Redirects to /dashboard/demo
  dashboard/[companyId]/
    layout.tsx               Sidebar nav + top bar (theme toggle, company badge)
    page.tsx                 Overview: KPI cards + MRR + retention charts
    at-risk/page.tsx         At-risk table (server) + AtRiskTable (client sort/filter)
    win-back/page.tsx        Win-back segments with copyable nudge copy
components/                  StatCard, RiskBadge, ThemeToggle, Sidebar,
                             MrrChart, RetentionChart, AtRiskTable, CopyButton
lib/
  analytics.ts               Pure functions: riskScore(), assessAll(),
                             churnRate(), mrrDelta()
  data/
    types.ts                 Member, MetricPoint, RiskAssessment, NudgeSegment…
    adapter.ts               RetainlyDataAdapter interface + getAdapter()
    mock.ts                  Deterministic MockAdapter (seeded PRNG)
    whop.ts                  WhopSdkAdapter (production, needs WHOP_API_KEY)
```

## Production wiring

`lib/data/whop.ts` maps each method to the real Whop REST v1 surface
(`https://api.whop.com/api/v1`, via `@whop/sdk`):

- `client.memberships.list({ account_id })` — memberships (filter by plan/status)
- `client.plans.list({ account_id })` — plan names + `initial_price` (smallest currency unit)
- `client.payments.list({ membership_id })` — failed-payment counts
- Member display name/email resolves via the users/members endpoint keyed by `user_id`
- `member.last_accessed_at` gives last-activity signal

**Verify exact field names against https://docs.whop.com at integration time.**

Future live sync: subscribe to `membership.renewed` /
`membership.cancelled` webhooks to invalidate the metrics cache instead of
polling.

## Pre-submit checklist (Whop App Store)

- [ ] Adopt the **Frosted UI** design system for all surfaces
- [ ] Replace the demo company badge with **Whop-only auth** via
      `verifyUserToken` (no custom login)
- [ ] Justify every requested permission in the app listing (read memberships,
      plans, payments — read-only)
- [ ] Confirm `DATA_MODE=whop` path end-to-end against a real company
- [ ] Replace hardcoded win-back copy with per-company editable templates
