import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@heyclaude/registry/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "HeyClaude Registry API",
  description:
    "Use the read-only HeyClaude Registry API for manifest, categories, search, entry detail, and per-entry LLM exports.",
  path: "/api-docs",
  keywords: ["heyclaude api", "claude directory api", "registry api"],
});

const examples = [
  {
    title: "Manifest",
    href: "/api/registry/manifest",
    code: "curl https://heyclau.de/api/registry/manifest",
  },
  {
    title: "Categories",
    href: "/api/registry/categories",
    code: "curl https://heyclau.de/api/registry/categories",
  },
  {
    title: "Search",
    href: "/api/registry/search?q=mcp&platform=gemini&limit=5",
    code: "curl 'https://heyclau.de/api/registry/search?q=mcp&platform=gemini&limit=5'",
  },
  {
    title: "Entry Detail",
    href: "/api/registry/entries/mcp/context7",
    code: "curl https://heyclau.de/api/registry/entries/{category}/{slug}",
  },
  {
    title: "Entry LLM Export",
    href: "/api/registry/entries/mcp/context7/llms",
    code: "curl https://heyclau.de/api/registry/entries/{category}/{slug}/llms",
  },
  {
    title: "Diff",
    href: "/api/registry/diff?since=2026-01-01&limit=10",
    code: "curl 'https://heyclau.de/api/registry/diff?since=2026-01-01&limit=10'",
  },
  {
    title: "Read-Only Feed",
    href: "/api/registry/feed",
    code: "curl https://heyclau.de/api/registry/feed",
  },
  {
    title: "Changelog Feed",
    href: "/data/registry-changelog.json",
    code: "curl https://heyclau.de/data/registry-changelog.json",
  },
  {
    title: "RSS Updates",
    href: "/feed.xml",
    code: "curl https://heyclau.de/feed.xml",
  },
  {
    title: "Quality Report",
    href: "/data/content-quality-report.json",
    code: "curl https://heyclau.de/data/content-quality-report.json",
  },
  {
    title: "Ecosystem Feed",
    href: "/data/ecosystem-feed.json",
    code: "curl https://heyclau.de/data/ecosystem-feed.json",
  },
  {
    title: "Search Artifact",
    href: "/data/search-index.json",
    code: "curl https://heyclau.de/data/search-index.json",
  },
  {
    title: "Raycast Feed",
    href: "/data/raycast-index.json",
    code: "curl https://heyclau.de/data/raycast-index.json",
  },
  {
    title: "Skill Cursor Adapter",
    href: "/data/skill-adapters/cursor/heyclaude-skill-submission-factory.mdc",
    code: "curl https://heyclau.de/data/skill-adapters/cursor/{skill}.mdc",
  },
  {
    title: "Community Signals",
    href: "/api/community-signals?targetKind=tool&targetKey=tool:cursor",
    code: "curl 'https://heyclau.de/api/community-signals?targetKind=tool&targetKey=tool:cursor'",
  },
];

export default function ApiDocsPage() {
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "API", url: `${siteConfig.url}/api-docs` },
    ]),
    buildWebPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/api-docs",
      name: "HeyClaude Registry API",
      description:
        "Read-only API examples for the HeyClaude registry and LLM exports.",
      breadcrumbId: `${siteConfig.url}/api-docs#breadcrumb`,
    }),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "API" }]} />
        <span className="eyebrow">Registry API</span>
        <h1 className="section-title">Read-only Registry API.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          HeyClaude exposes stable, envelope-versioned endpoints for search,
          category browse, entry detail, and LLM-ready text. Responses include
          cache headers and ETags so downstream clients can poll cheaply. The
          registry feed links the manifest, hashes, public feeds, and quality
          summary for downstream consumers.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {examples.map((example) => (
          <article key={example.title} className="surface-panel space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {example.title}
              </h2>
              <Link
                href={example.href}
                className="text-sm font-medium text-primary underline underline-offset-4"
              >
                Open
              </Link>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
              <code>{example.code}</code>
            </pre>
          </article>
        ))}
      </section>

      <section className="surface-panel space-y-3 p-5 text-sm leading-7 text-muted-foreground">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Contract Notes
        </h2>
        <p>
          Content is Git-backed and read-only through the public API. Dynamic
          state such as votes, jobs, leads, community signals, and sponsorship
          windows stays in the site database and is tightly limited outside the
          editorial registry contract. Registry publishing is not exposed as a
          public API; submissions remain issue-first and maintainer-reviewed.
        </p>
        <p>
          Use <code className="text-foreground">If-None-Match</code> with the
          returned <code className="text-foreground">ETag</code> header for
          incremental syncs.
        </p>
      </section>
    </div>
  );
}
