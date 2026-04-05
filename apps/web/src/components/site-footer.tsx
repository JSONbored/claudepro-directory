import Link from "next/link";

import { BrandWordmark } from "@/components/brand-wordmark";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 py-14">
      <div className="container-shell grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <BrandWordmark />
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            A community-built directory for Claude-native tools, prompts, configs,
            and reusable workflows.
          </p>
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
          <a href={`${siteConfig.githubUrl}/issues/new/choose`} target="_blank" rel="noreferrer" className="block transition hover:text-foreground">
            Submit via GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
