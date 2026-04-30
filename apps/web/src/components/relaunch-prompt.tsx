"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "heyclaude-relaunch-prompt-dismissed";

export function RelaunchPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) === "1") return;
      const timer = window.setTimeout(() => setVisible(true), 3500);
      return () => window.clearTimeout(timer);
    } catch {
      return;
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // no-op
    }
  };

  if (!visible) return null;

  return (
    <aside className="fixed bottom-4 left-4 z-[78] w-[min(26rem,calc(100vw-1.5rem))] rounded-2xl border-2 border-primary/55 bg-card/95 p-4 shadow-2xl backdrop-blur toast-enter">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss relaunch notice"
        className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full border border-border/80 bg-background/70 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
        <Sparkles className="size-3.5" />
        Relaunched
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        HeyClaude now has faster pages, persistent upvotes, and cleaner
        category-aware detail views.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/browse"
          className="inline-flex rounded-full border border-primary/45 bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
        >
          Explore now
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex rounded-full border border-border bg-background px-3.5 py-1.5 text-xs text-muted-foreground transition hover:border-primary/35 hover:text-foreground"
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
}
