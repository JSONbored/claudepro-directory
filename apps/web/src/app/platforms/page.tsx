import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { getPlatformPages } from "@/lib/platform-pages";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
} from "@heyclaude/registry/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Agent Skill platform compatibility",
  description:
    "Browse HeyClaude Agent Skills by Claude, Codex, Windsurf, Gemini, Cursor rule adapter, and AGENTS.md compatibility.",
  path: "/platforms",
  keywords: ["agent skills", "claude skills", "codex skills", "cursor rules"],
});

export default async function PlatformsPage() {
  const platforms = await getPlatformPages();
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Platforms", url: `${siteConfig.url}/platforms` },
    ]),
    buildCollectionPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/platforms",
      name: "Agent Skill platform compatibility",
      description:
        "Browse HeyClaude Agent Skills by platform compatibility and generated adapters.",
      breadcrumbId: `${siteConfig.url}/platforms#breadcrumb`,
    }),
    buildItemListJsonLd(
      platforms.map((platform) => ({
        name: platform.title,
        url: `${siteConfig.url}/platforms/${platform.slug}`,
      })),
      {
        name: "Agent Skill platform compatibility",
        description:
          "Platform-specific indexes for HeyClaude Agent Skills and adapters.",
      },
    ),
  ];

  return (
    <main className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <header className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Platforms" }]}
        />
        <span className="eyebrow">Platform compatibility</span>
        <h1 className="section-title text-balance">
          Agent Skills by platform and adapter format.
        </h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          These pages are generated from the same compatibility metadata that
          powers registry feeds, detail pages, Cursor adapters, and API clients.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {platforms.map((platform) => (
          <Link
            key={platform.slug}
            href={`/platforms/${platform.slug}`}
            className="surface-panel p-5 transition hover:border-primary/50"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="eyebrow">{platform.eyebrow}</span>
              <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
                {platform.count} skills
              </span>
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
              {platform.title}
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {platform.description}
            </p>
            <p className="mt-4 text-xs font-medium text-primary">
              {platform.ctaLabel}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
