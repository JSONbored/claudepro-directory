import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { getContributors } from "@/lib/contributors";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
} from "@heyclaude/registry/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "HeyClaude contributors",
  description:
    "Browse accepted HeyClaude contributors, attributed Claude resources, review history, and GitHub-backed listings across the registry.",
  path: "/contributors",
});

export default async function ContributorsPage() {
  const contributors = await getContributors();
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Contributors", url: `${siteConfig.url}/contributors` },
    ]),
    buildCollectionPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/contributors",
      name: "HeyClaude contributors",
      description: "Accepted contributors and attributed directory entries.",
      breadcrumbId: `${siteConfig.url}/contributors#breadcrumb`,
    }),
    buildItemListJsonLd(
      contributors.slice(0, 100).map((contributor) => ({
        name: contributor.name,
        url: `${siteConfig.url}/contributors/${contributor.slug}`,
      })),
      { name: "HeyClaude contributors" },
    ),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Contributors" }]}
        />
        <span className="eyebrow">Contributors</span>
        <h1 className="section-title">Accepted contributor profiles.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          Attribution is built from accepted registry entries. Profile pages are
          source-backed and stay maintainer-reviewed.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contributors.map((contributor) => (
          <Link
            key={contributor.slug}
            href={`/contributors/${contributor.slug}`}
            className="surface-panel p-5 transition hover:border-primary/45"
          >
            <p className="text-lg font-semibold tracking-tight text-foreground">
              {contributor.name}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {contributor.entryCount} accepted{" "}
              {contributor.entryCount === 1 ? "entry" : "entries"}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
