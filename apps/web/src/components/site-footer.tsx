import Link from "next/link";

import { BrandWordmark } from "@/components/brand-wordmark";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 py-14">
      <div className="container-shell grid gap-10 md:grid-cols-[1.8fr_1fr_1fr]">
        <div className="space-y-4">
          <BrandWordmark />
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            A GitHub-native directory for Claude agents, MCP servers, reusable skills,
            workflow hooks, commands, and practical guides.
          </p>
          <a
            href={`${siteConfig.githubUrl}/issues/new/choose`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
          >
            Submit via GitHub
          </a>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Navigation</p>
          <Link href="/browse" className="block transition hover:text-foreground">Browse</Link>
          <Link href="/jobs" className="block transition hover:text-foreground">Jobs</Link>
          <Link href="/about" className="block transition hover:text-foreground">About</Link>
          <Link href="/submit" className="block transition hover:text-foreground">Submit</Link>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Project</p>
          <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer" className="block transition hover:text-foreground">
            GitHub
          </a>
          <a href={`${siteConfig.githubUrl}/issues`} target="_blank" rel="noreferrer" className="block transition hover:text-foreground">
            Issues
          </a>
        </div>
      </div>
    </footer>
  );
}
