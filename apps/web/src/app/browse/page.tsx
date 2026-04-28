import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { BrowseDirectory } from "@/components/browse-directory";
import { JsonLd } from "@/components/json-ld";
import { getDirectoryEntries } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
} from "@heyclaude/registry/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Browse the HeyClaude directory",
  description:
    "Search and filter HeyClaude entries for Claude agents, MCP servers, skills, commands, hooks, rules, guides, and curated collections.",
  path: "/browse",
  keywords: [
    "browse claude tools",
    "claude directory",
    "mcp server directory",
    "ai workflow library",
  ],
});

type BrowsePageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    utility?: string;
    platform?: string;
    sort?: string;
  }>;
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const directoryEntries = await getDirectoryEntries();
  const initialEntries = directoryEntries.slice(0, 15);
  const params = searchParams ? await searchParams : undefined;
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Browse", url: `${siteConfig.url}/browse` },
    ]),
    buildCollectionPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/browse",
      name: "Browse the HeyClaude directory",
      description: "Searchable directory of Claude resources.",
      breadcrumbId: `${siteConfig.url}/browse#breadcrumb`,
    }),
    buildItemListJsonLd(
      directoryEntries.slice(0, 100).map((entry) => ({
        name: entry.title,
        url: `${siteConfig.url}/${entry.category}/${entry.slug}`,
      })),
      {
        name: "HeyClaude browse index",
        description: "Searchable directory of Claude resources.",
      },
    ),
  ];

  return (
    <div className="container-shell max-w-[52rem] space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Browse" }]}
        />
        <span className="eyebrow">Browse</span>
        <h1 className="section-title">Browse the full directory.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          Search across agents, MCP servers, skills, rules, commands, hooks,
          guides, collections, and statuslines.
        </p>
      </div>
      <BrowseDirectory
        entries={initialEntries}
        initialQuery={params?.q ?? ""}
        initialCategory={params?.category ?? "all"}
        initialUtilityFilter={params?.utility ?? "all"}
        initialPlatformFilter={params?.platform ?? "all"}
        initialSortMode={params?.sort ?? "popular"}
        limit={15}
        entriesUrl="/data/directory-index.json"
        syncUrl
      />
    </div>
  );
}
