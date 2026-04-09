import Link from "next/link";
import { FileText, ShieldCheck, Zap } from "lucide-react";

import { siteConfig } from "@/lib/site";

export default function AboutPage() {
  return (
    <div className="container-shell space-y-10 py-12">
      <div className="space-y-4 border-b border-border/80 pb-8">
        <span className="eyebrow">About</span>
        <h1 className="section-title">A note from the maintainer.</h1>
        <p className="max-w-3xl text-base leading-8 text-muted-foreground">
          HeyClaude exists to make Claude resources easy to discover and actually useful in practice.
          Not just listed, but installable, copyable, and verifiable.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="surface-panel p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Why this project exists</p>
          <div className="mt-3 space-y-4 text-sm leading-8 text-muted-foreground">
            <p>
              The previous version of this project overreached and became hard to maintain.
              HeyClaude is the reset: a focused, GitHub-native directory with a tighter product surface and
              higher bar for practical utility.
            </p>
            <p>
              Every entry should answer the same question: can someone use this right now with minimal friction?
              That means real install commands, source links, clear metadata, and structured category-aware rendering.
            </p>
            <p>
              The repo is the source of truth for content. D1 is used where persistent runtime data makes sense
              (for example upvotes and jobs listings), but the core model stays intentionally lightweight.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="surface-panel p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Quick links</p>
            <div className="mt-4 space-y-3 text-sm">
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-border bg-background px-4 py-3"
              >
                GitHub repository
              </a>
              <Link href="/browse" className="block rounded-xl border border-border bg-background px-4 py-3">
                Browse the directory
              </Link>
              <Link href="/submit" className="block rounded-xl border border-border bg-background px-4 py-3">
                Submit something useful
              </Link>
              <Link href="/jobs" className="block rounded-xl border border-border bg-background px-4 py-3">
                Post or browse jobs
              </Link>
              <a
                href={`mailto:${siteConfig.jobsEmail}`}
                className="block rounded-xl border border-border bg-background px-4 py-3"
              >
                Contact: {siteConfig.jobsEmail}
              </a>
            </div>
          </div>

          <div className="surface-panel p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Principles</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
              <li className="rounded-xl border border-border bg-background px-4 py-3">
                Keep the stack lean. Avoid complexity that does not improve user outcomes.
              </li>
              <li className="rounded-xl border border-border bg-background px-4 py-3">
                Favor truthful metadata and usable assets over vanity metrics.
              </li>
              <li className="rounded-xl border border-border bg-background px-4 py-3">
                Open-source by default, with clear contribution paths and schema guardrails.
              </li>
            </ul>
          </div>

          <div className="surface-panel p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current status</p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3">
                <Zap className="size-4 text-primary" />
                Cloudflare Workers runtime with OpenNext deployment.
              </p>
              <p className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3">
                <ShieldCheck className="size-4 text-primary" />
                D1-backed persistent upvotes and package trust metadata.
              </p>
              <p className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3">
                <FileText className="size-4 text-primary" />
                GitHub Issue Forms + schema references for clean submissions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
