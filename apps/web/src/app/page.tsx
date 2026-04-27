import type { Metadata } from "next";
import Link from "next/link";

import { BrowseDirectory } from "@/components/browse-directory";
import { GitHubStarsLive } from "@/components/github-stars-live";
import { JsonLd } from "@/components/json-ld";
import { getCategorySummaries, getDirectoryEntries } from "@/lib/content";
import { getGrowthSurfaces } from "@/lib/growth-surfaces";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { buildItemListJsonLd } from "@heyclaude/registry/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Discover Claude tools, skills, MCP servers, and workflows",
  description:
    "Explore a GitHub-native directory of Claude agents, MCP servers, skills, commands, hooks, rules, and practical guides.",
  path: "/",
  keywords: [
    "claude",
    "claude code",
    "mcp servers",
    "ai skills",
    "claude agents",
    "ai workflows",
  ],
});

export default async function HomePage() {
  const [directoryEntries, categories, growthSurfaces] = await Promise.all([
    getDirectoryEntries(),
    getCategorySummaries(),
    getGrowthSurfaces(),
  ]);
  const initialEntries = directoryEntries.slice(0, 15);
  const totalEntries = categories.reduce(
    (sum, category) => sum + category.count,
    0,
  );
  const jsonLd = buildItemListJsonLd(
    initialEntries.map((entry) => ({
      name: entry.title,
      url: `${siteConfig.url}/${entry.category}/${entry.slug}`,
    })),
    {
      name: "Featured HeyClaude entries",
      description:
        "A starting set of Claude resources from the HeyClaude directory.",
    },
  );

  return (
    <div className="pb-24">
      <JsonLd data={jsonLd} />
      <section className="border-b border-border/80">
        <div className="container-shell py-14 text-center sm:py-18">
          <div className="mx-auto max-w-4xl space-y-5">
            <span className="eyebrow">Community directory for Claude</span>
            <h1 className="display-title text-balance">
              Discover the best Claude tools, skills, MCP servers, and
              workflows.
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground">
              A GitHub-native directory for Claude Code setups, MCP
              integrations, prompts, hooks, reusable skills, and practical
              guides.
            </p>
            <div className="hero-stats-grid">
              <div className="hero-stat-block">
                <div className="hero-stat-number">
                  <GitHubStarsLive withPlus fallback={0} />
                </div>
                <div className="hero-stat-label">GitHub Stars</div>
              </div>
              <div className="hero-stat-block">
                <div className="hero-stat-number">{categories.length}</div>
                <div className="hero-stat-label">Categories</div>
              </div>
              <div className="hero-stat-block">
                <div className="hero-stat-number">
                  {totalEntries.toLocaleString()}+
                </div>
                <div className="hero-stat-label">Configs</div>
              </div>
            </div>
          </div>
          <div className="mx-auto mt-14 max-w-[52rem] text-left">
            <BrowseDirectory
              entries={initialEntries}
              limit={15}
              entriesUrl="/data/directory-index.json"
            />
          </div>
        </div>
      </section>
      <section className="container-shell grid gap-4 py-10 md:grid-cols-3">
        {[
          ["Trending", "/trending", growthSurfaces.trendingCandidates.length],
          ["Newly added", "/browse?sort=newest", growthSurfaces.newest.length],
          ["API", "/api-docs", directoryEntries.length],
        ].map(([label, href, count]) => (
          <Link
            key={href}
            href={String(href)}
            className="surface-panel p-5 transition hover:border-primary/45"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-primary">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {Number(count).toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Open this discovery surface
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
