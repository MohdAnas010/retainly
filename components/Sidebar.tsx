"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const LINKS = [
  { href: "", label: "Overview" },
  { href: "/at-risk", label: "At-Risk Members" },
  { href: "/win-back", label: "Win-Back" },
];

export default function Sidebar() {
  const params = useParams<{ companyId: string }>();
  const pathname = usePathname();
  const base = `/dashboard/${params.companyId}`;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-zinc-200 bg-white px-4 py-6 md:flex dark:border-zinc-800 dark:bg-zinc-900">
        <LogoMark />
        <nav className="mt-8 flex flex-col gap-1">
          {LINKS.map((l) => {
            const href = `${base}${l.href}`;
            const active = pathname === href;
            return (
              <Link
                key={l.label}
                href={href}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-frosted-highlight/10 text-frosted-highlight"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl bg-zinc-100 p-3 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          Demo data — connect your Whop account to see live metrics.
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="border-b border-zinc-200 bg-white md:hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3 px-4 py-3">
          <LogoMark compact />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-3">
          {LINKS.map((l) => {
            const href = `${base}${l.href}`;
            const active = pathname === href;
            return (
              <Link
                key={l.label}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap ${
                  active
                    ? "bg-frosted-highlight/10 text-frosted-highlight"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-frosted-highlight to-frosted-primary text-lg font-bold text-white">
        R
      </div>
      {!compact && (
        <span className="text-lg font-semibold tracking-tight">Retainly</span>
      )}
    </div>
  );
}
