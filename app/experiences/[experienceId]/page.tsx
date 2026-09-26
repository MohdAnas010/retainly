import { redirect } from "next/navigation";

/**
 * Whop "Experience path" (/experiences/[experienceId]).
 *
 * Retainly is a company-facing (B2B) app: the experience view shows the
 * company's dashboard. The hardened /dashboard/[companyId] route owns all
 * auth (Whop token verification + admin/owner check), so this route simply
 * resolves the company and hands off to it.
 *
 * - Demo mode (no WHOP_API_KEY): the public demo dashboard.
 * - Production: the single installed company (WHOP_COMPANY_ID).
 */
export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  await params; // acknowledged; company resolution is env-based (see above)
  const companyId = process.env.WHOP_COMPANY_ID ?? "demo";
  redirect(`/dashboard/${companyId}`);
}
