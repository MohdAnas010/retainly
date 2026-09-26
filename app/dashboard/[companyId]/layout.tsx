import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { requireDashboardAccess } from "@/lib/auth";

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  return <DashboardShell params={params}>{children}</DashboardShell>;
}

async function DashboardShell({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // Whop-only auth: no separate login. Demo mode (no WHOP_API_KEY) allows
  // only the "demo" company; with keys set, the viewer must be a company
  // admin/owner. Throws a clear error otherwise.
  await requireDashboardAccess(companyId);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-60">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur md:px-8 dark:border-zinc-800 dark:bg-zinc-950/80">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {companyId === "demo" ? "Demo company" : companyId}
            </span>
          </div>
          <ThemeToggle />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
