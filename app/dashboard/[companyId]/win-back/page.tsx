import CopyButton from "@/components/CopyButton";
import { getAdapter } from "@/lib/data/adapter";
import type { NudgeSegment } from "@/lib/data/types";

function SegmentCard({ segment }: { segment: NudgeSegment }) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{segment.title}</h2>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          {segment.count} members
        </span>
      </div>

      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        <span className="font-medium text-zinc-800 dark:text-zinc-200">
          Why they churn:{" "}
        </span>
        {segment.why}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Suggested nudge
        </p>
        <CopyButton text={segment.nudgeCopy} />
      </div>
      <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm whitespace-pre-line text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
        {segment.nudgeCopy}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="rounded-lg bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          Channel: {segment.channel}
        </span>
      </div>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          Expected impact:{" "}
        </span>
        {segment.impact}
      </p>
    </div>
  );
}

export default async function WinBackPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const adapter = getAdapter();
  const segments = await adapter.getWinBack(companyId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Win-back playbook</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Ready-to-send outreach for the three segments most likely to return.
          Copy a nudge, personalize the placeholders, and send it through Whop.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {segments.map((s) => (
          <SegmentCard key={s.id} segment={s} />
        ))}
      </div>
    </div>
  );
}
