/**
 * Whop-only auth for the Dashboard view.
 *
 * There is no separate Retainly login — identity comes exclusively from the
 * Whop session:
 *   1. `verifyUserToken` (from @whop/api) validates the user token Whop
 *      injects into the iframe request headers and returns the userId.
 *   2. `listAuthorizedUsers` checks that this user is an admin/owner of the
 *      company whose dashboard is being viewed.
 *
 * NOTE on SDK naming: the auth helpers (`verifyUserToken`, `WhopServerSdk`)
 * live in `@whop/api` (Whop's app-framework SDK). The `@whop/sdk` v2 package
 * is a pure REST resource client and does not export them.
 *
 * Demo mode: with no WHOP_API_KEY set, only `/dashboard/demo` is reachable
 * (mock data). Every other company id throws a clear error telling the owner
 * exactly what to paste into .env. No real secrets are ever handled here.
 */
import { headers } from "next/headers";
import { verifyUserToken, WhopServerSdk } from "@whop/api";

export type DashboardAccess =
  | { mode: "demo" }
  | { mode: "whop"; userId: string };

function requireEnv(name: "WHOP_API_KEY" | "WHOP_APP_ID"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[retainly] ${name} is missing. The owner must create the app in the Whop ` +
        `dashboard (Developer → Apps → Retainly → API keys) and paste ${name} into ` +
        `.env — see .env.example. Never commit real keys to the repo.`
    );
  }
  return value;
}

/** Lazily builds the server SDK. Throws a clear error when keys are missing. */
export function getWhopServerSdk() {
  return WhopServerSdk({
    appApiKey: requireEnv("WHOP_API_KEY"),
    appId: requireEnv("WHOP_APP_ID"),
  });
}

/**
 * Gate for every /dashboard/* route. Call at the top of the dashboard layout.
 *
 * - No WHOP_API_KEY + companyId === "demo"  → demo mode (mock data, no auth).
 * - No WHOP_API_KEY + any other companyId   → throws: owner must add keys.
 * - WHOP_API_KEY set                        → verifies the Whop user token and
 *   requires the user to be an admin or owner of the company; otherwise throws.
 */
export async function requireDashboardAccess(
  companyId: string
): Promise<DashboardAccess> {
  if (!process.env.WHOP_API_KEY) {
    if (companyId === "demo") return { mode: "demo" };
    throw new Error(
      "[retainly] WHOP_API_KEY is not set — only the demo company (/dashboard/demo) " +
        "is available. To connect a real company, the owner must paste WHOP_API_KEY and " +
        "WHOP_APP_ID into .env (see .env.example)."
    );
  }

  // 1. Whop-only auth: token comes from the Whop iframe session headers.
  const hdrs = await headers();
  const { userId } = await verifyUserToken(hdrs); // throws on missing/invalid token

  // 2. Dashboard view is restricted to company admins/owners.
  const sdk = getWhopServerSdk();
  const company = await sdk.companies.listAuthorizedUsers({ companyId });
  const entry = (company?.authorizedUsers ?? []).find(
    (u: { userId?: string | null }) => u.userId === userId
  );
  if (entry?.role !== "admin" && entry?.role !== "owner") {
    throw new Error(
      "[retainly] access denied — this dashboard view is restricted to company admins and owners."
    );
  }

  return { mode: "whop", userId };
}
