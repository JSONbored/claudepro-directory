import Link from "next/link";
import { Star } from "lucide-react";

import { BrandWordmark } from "@/components/brand-wordmark";
import { GitHubStarsLive } from "@/components/github-stars-live";
import { DiscordMark } from "@/components/icons/discord-mark";
import { GitHubMark } from "@/components/icons/github-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  const githubRepoLabel = siteConfig.githubUrl
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\/$/, "");
  const [githubOwner, githubRepo] = githubRepoLabel.split("/", 2);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/88 backdrop-blur">
      <div className="container-shell flex h-15 items-center justify-between gap-6">
        <BrandWordmark />
        <div className="ml-auto flex items-center gap-2.5 md:gap-3">
          <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 transition hover:bg-card hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-full border border-border/80 bg-card/70 px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-primary/35 hover:bg-card hover:text-foreground md:inline-flex"
            aria-label="Open GitHub repository"
            title="Open GitHub repository"
          >
            <GitHubMark className="size-3.5 shrink-0" />
            <span className="min-w-0 whitespace-nowrap text-foreground/90">
              {githubRepo ? (
                <>
                  <span className="inline-block max-w-[6.25rem] truncate align-bottom">
                    {githubOwner}
                  </span>
                  <span className="mx-1.5 text-muted-foreground/80">/</span>
                  <span className="inline-block max-w-[7rem] truncate align-bottom">
                    {githubRepo}
                  </span>
                </>
              ) : (
                <span className="inline-block max-w-[12rem] truncate align-bottom">
                  {githubRepoLabel}
                </span>
              )}
            </span>
            <span className="h-3 w-px bg-border/90" aria-hidden />
            <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/65 px-2 py-0.5 text-[11px] font-medium text-foreground/85">
              <Star className="size-3 fill-current" />
              <span>
                <GitHubStarsLive />
              </span>
            </span>
          </a>
          {siteConfig.discordUrl ? (
            <a
              href={siteConfig.discordUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden size-9 items-center justify-center rounded-full border border-border/80 bg-card/70 text-muted-foreground transition hover:border-primary/35 hover:text-foreground md:inline-flex"
              aria-label="Open Discord"
              title="Open Discord"
            >
              <DiscordMark className="size-4" />
            </a>
          ) : null}
          <span
            className="hidden h-5 w-px bg-border/80 md:inline-block"
            aria-hidden
          />
          <ThemeToggle />
          <Link
            href="/submit"
            className="inline-flex items-center rounded-full border border-primary/35 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_26px_-12px_color-mix(in_oklab,var(--primary)_74%,transparent)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_-14px_color-mix(in_oklab,var(--primary)_80%,transparent)]"
          >
            Submit
          </Link>
        </div>
      </div>
    </header>
  );
}
