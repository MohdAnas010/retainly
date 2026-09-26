import Image from "next/image";
import Link from "next/link";

const features = [
  {
    title: "Churn radar",
    body: "Every member scored by churn risk — Critical, Watch, Healthy — updated as engagement and billing data change.",
  },
  {
    title: "At-risk member list",
    body: "Filter and sort by plan, inactivity, and tenure. Know exactly who to contact first, and why they're slipping.",
  },
  {
    title: "Win-back playbook",
    body: "Ready-to-send outreach templates for the three segments most likely to return: dormant-but-paying, failed payments, and low-activation new members.",
  },
  {
    title: "Retention analytics",
    body: "Track MRR trend, churn rate, and cohort retention curves over time. See where revenue is leaking.",
  },
];

const steps = [
  {
    n: "1",
    title: "Install on your Whop",
    body: "Add Retainly to your community in one click. No spreadsheets, no setup calls.",
  },
  {
    n: "2",
    title: "Retainly scores every member",
    body: "Membership, payment, and engagement signals turn into a clear risk score per member.",
  },
  {
    n: "3",
    title: "Reach out before they cancel",
    body: "Copy a win-back nudge, personalize it, and send it through Whop — while there's still time.",
  },
];

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <Image
            src="/retainly-icon-512.png"
            alt="Retainly"
            width={36}
            height={36}
            className="rounded-xl"
          />
          <span className="text-lg font-semibold tracking-tight">Retainly</span>
        </div>
        <Link
          href="/dashboard/demo"
          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
        >
          View live demo
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 text-center md:pt-20">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
          Built for Whop communities
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Spot at-risk members early. Win them back.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-zinc-400 md:text-lg">
          Retainly monitors your community&apos;s memberships and flags members
          showing churn signals — so you can reach out before they cancel.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard/demo"
            className="rounded-full bg-violet-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Try the live demo
          </Link>
          <a
            href="#how-it-works"
            className="rounded-full border border-zinc-700 px-7 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500"
          >
            How it works
          </a>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl shadow-violet-950/40">
          <Image
            src="/discover/shot-overview.png"
            alt="Retainly overview dashboard"
            width={1600}
            height={900}
            className="h-auto w-full"
            priority
          />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">
          Everything you need to stop churn
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
            >
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {f.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <Image
              src="/discover/shot-atrisk.png"
              alt="At-risk members table"
              width={1600}
              height={900}
              className="h-auto w-full"
            />
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <Image
              src="/discover/shot-winback.png"
              alt="Win-back playbook"
              width={1600}
              height={900}
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">
          How it works
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <div className="rounded-3xl border border-violet-900/60 bg-gradient-to-b from-violet-950/60 to-zinc-900 px-6 py-14">
          <h2 className="mx-auto max-w-2xl text-2xl font-bold tracking-tight md:text-4xl">
            Stop churn before it happens.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-400 md:text-base">
            Install Retainly on your Whop community and see exactly who needs
            your attention today.
          </p>
          <Link
            href="/dashboard/demo"
            className="mt-8 inline-block rounded-full bg-violet-600 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Explore the demo
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-900 py-8 text-center text-xs text-zinc-600">
        Retainly — churn radar for Whop communities.
      </footer>
    </div>
  );
}
