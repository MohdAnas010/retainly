"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      onClick={copy}
      className="rounded-lg bg-frosted-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-frosted-primary-hover"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
