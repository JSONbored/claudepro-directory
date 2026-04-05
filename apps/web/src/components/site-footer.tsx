import Link from "next/link";

import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] py-16">
      <div className="container grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="text-2xl font-semibold tracking-[-0.05em]">HeyClaude</p>
          <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">
            A community-run directory for Claude agents, MCP servers, skills, guides,
            rules, commands, hooks, and jobs.
          </p>
        </div>
        <div className="space-y-3 text-sm text-[var(--muted)]">
          <p className="font-medium text-[var(--ink)]">Explore</p>
          <Link href="/browse" className="block">
            Browse all
          </Link>
          <Link href="/about" className="block">
            About
          </Link>
          <Link href="/jobs" className="block">
            Jobs
          </Link>
          <Link href="/advertise" className="block">
            Advertise
          </Link>
        </div>
        <div className="space-y-3 text-sm text-[var(--muted)]">
          <p className="font-medium text-[var(--ink)]">Project</p>
          <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer" className="block">
            GitHub
          </a>
          <a href={siteConfig.legacyUrl} target="_blank" rel="noreferrer" className="block">
            Legacy domain
          </a>
        </div>
      </div>
    </footer>
  );
}
