import Link from "next/link";

import { BrandWordmark } from "@/components/brand-wordmark";
import { DiscordMark } from "@/components/icons/discord-mark";
import { GitHubMark } from "@/components/icons/github-mark";
import { TwitterMark } from "@/components/icons/twitter-mark";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 py-14">
      <div className="container-shell grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr_1.1fr]">
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
          <p className="font-medium text-foreground">Social</p>
          <div className="flex items-center gap-2">
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:border-primary/35 hover:text-foreground"
              aria-label="Open GitHub repository"
            >
              <GitHubMark className="size-4" />
            </a>
            <a
              href={siteConfig.twitterUrl}
              target={siteConfig.twitterUrl.startsWith("http") ? "_blank" : undefined}
              rel={siteConfig.twitterUrl.startsWith("http") ? "noreferrer" : undefined}
              className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:border-primary/35 hover:text-foreground"
              aria-label="Open Twitter/X"
            >
              <TwitterMark className="size-4" />
            </a>
            <a
              href={siteConfig.discordUrl}
              target={siteConfig.discordUrl.startsWith("http") ? "_blank" : undefined}
              rel={siteConfig.discordUrl.startsWith("http") ? "noreferrer" : undefined}
              className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:border-primary/35 hover:text-foreground"
              aria-label="Open Discord"
            >
              <DiscordMark className="size-4" />
            </a>
          </div>
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
        <NewsletterSignup />
      </div>
    </footer>
  );
}
