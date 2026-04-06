import Link from "next/link";

import { siteConfig } from "@/lib/site";

export default function AboutPage() {
  return (
    <div className="container-shell space-y-10 py-12">
      <div className="space-y-4 border-b border-border/80 pb-8">
        <span className="eyebrow">About</span>
        <h1 className="section-title">Why HeyClaude exists.</h1>
        <p className="max-w-3xl text-base leading-8 text-muted-foreground">
          HeyClaude is a GitHub-native directory for Claude assets: agents, MCP
          servers, skills, hooks, rules, commands, guides, collections, and jobs.
          The point is simple: make the Claude ecosystem easier to discover,
          evaluate, copy, install, and actually use.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="surface-panel p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Built for actual use
          </p>
          <div className="mt-3 space-y-4 text-sm leading-8 text-muted-foreground">
            <p>
              This is not meant to be a dead content archive. The long-term goal is a
              practical directory where each entry gives you what you need to use it:
              source, install path, copyable config, docs, and enough structure to
              understand what it does before you trust it.
            </p>
            <p>
              The current corpus lives in GitHub and the repo is the source of truth.
              That keeps the stack lightweight, contribution-friendly, and cheap to run.
            </p>
            <p>
              The site is maintained by <span className="text-foreground">JSONbored</span>.
              Right now the cleanest way to follow the project or contribute is through
              the repo itself.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="surface-panel p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Quick links
            </p>
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
            </div>
          </div>

          <div className="surface-panel p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Principles
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
              <li className="rounded-xl border border-border bg-background px-4 py-3">
                GitHub-first content, not a heavy paid backend.
              </li>
              <li className="rounded-xl border border-border bg-background px-4 py-3">
                Every entry should be understandable and usable by a real person.
              </li>
              <li className="rounded-xl border border-border bg-background px-4 py-3">
                Strong SEO, clean metadata, and low-friction contributions.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
