import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { getContentQualityReport } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo";
import { categoryLabels, siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
} from "@heyclaude/registry/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "HeyClaude registry quality",
  description:
    "Content quality, provenance, SEO, and maintenance signals for the HeyClaude registry.",
  path: "/quality",
  keywords: [
    "heyclaude quality",
    "claude registry quality",
    "ai citation quality",
  ],
});

export default async function QualityPage() {
  const report = await getContentQualityReport();
  const categories = Object.entries(report.categoryBreakdown).sort(
    ([left], [right]) =>
      (categoryLabels[left] ?? left).localeCompare(
        categoryLabels[right] ?? right,
      ),
  );
  const improvementQueue = [...report.entries]
    .filter((entry) => entry.warnings.length)
    .sort((left, right) => left.scores.total - right.scores.total)
    .slice(0, 12);
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Quality", url: `${siteConfig.url}/quality` },
    ]),
    buildCollectionPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/quality",
      name: "HeyClaude registry quality",
      description:
        "Content quality, provenance, SEO, and maintenance signals for the HeyClaude registry.",
      breadcrumbId: `${siteConfig.url}/quality#breadcrumb`,
    }),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Quality" }]}
        />
        <span className="eyebrow">Registry quality</span>
        <h1 className="section-title">Quality, provenance, and SEO signals.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          This dashboard is generated from the same registry contract that
          powers search, Raycast, LLM exports, and API consumers.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Average score", report.summary.averageScore],
          ["Entries", report.count],
          ["First-party editorial", report.summary.firstPartyEditorialCount],
          ["Missing SEO", report.summary.missingSeoCount],
        ].map(([label, value]) => (
          <div key={label} className="surface-panel p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {categories.map(([category, data]) => (
          <Link
            key={category}
            href={`/${category}`}
            className="surface-panel p-5 transition hover:border-primary/50"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {categoryLabels[category] ?? category}
              </h2>
              <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
                {data.count} entries
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Average
                </p>
                <p className="mt-1 text-foreground">{data.averageScore}/100</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Warnings
                </p>
                <p className="mt-1 text-foreground">{data.warningCount}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="surface-panel p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Maintainer improvement queue
          </h2>
          <Link
            href="/data/content-quality-report.json"
            className="text-sm font-medium text-primary underline underline-offset-4"
          >
            Raw report
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {improvementQueue.map((entry) => (
            <Link
              key={entry.key}
              href={`/${entry.category}/${entry.slug}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3 text-sm transition hover:border-primary/50"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground">
                  {entry.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {categoryLabels[entry.category] ?? entry.category} -{" "}
                  {entry.warnings.length} warning
                  {entry.warnings.length === 1 ? "" : "s"}
                </span>
              </span>
              <span className="shrink-0 text-muted-foreground">
                {entry.scores.total}/100
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
