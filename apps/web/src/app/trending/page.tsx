import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { DirectoryEntryCard } from "@/components/directory-entry-card";
import { JsonLd } from "@/components/json-ld";
import { getGrowthSurfaces } from "@/lib/growth-surfaces";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
} from "@heyclaude/registry/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Popular, trending, and new Claude resources",
  description:
    "Browse popular, fresh, and copy-ready HeyClaude resources grouped by source-backed signals, registry updates, and practical AI utility.",
  path: "/trending",
});

export default async function TrendingPage() {
  const surfaces = await getGrowthSurfaces();
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Trending", url: `${siteConfig.url}/trending` },
    ]),
    buildCollectionPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/trending",
      name: "Popular, trending, and new Claude resources",
      description:
        "Fresh and source-backed HeyClaude discovery surfaces without fabricated popularity.",
      breadcrumbId: `${siteConfig.url}/trending#breadcrumb`,
    }),
  ];

  const groups = [
    ["Popular by source signals", surfaces.popularBySourceSignals],
    ["Trending candidates", surfaces.trendingCandidates],
    ["Newly added", surfaces.newest],
    ["Recently updated upstream", surfaces.recentlyUpdated],
  ] as const;

  return (
    <div className="container-shell space-y-10 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Trending" }]}
        />
        <span className="eyebrow">Discovery</span>
        <h1 className="section-title">Popular, trending, and new resources.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          These surfaces use visible registry fields, upstream source signals,
          and freshness data. They do not claim private usage popularity unless
          those metrics are explicitly collected and labeled.
        </p>
      </div>

      {groups.map(([title, entries]) => (
        <section key={title} className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <div className="space-y-4">
            {entries.slice(0, 4).map((entry) => (
              <DirectoryEntryCard
                key={`${title}:${entry.category}:${entry.slug}`}
                entry={entry}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
