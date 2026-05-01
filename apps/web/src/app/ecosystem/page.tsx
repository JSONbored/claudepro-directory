import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import {
  getRegistryChangelog,
  getRegistryManifest,
  getRegistryTrustReport,
} from "@/lib/content";
import { getContributors } from "@/lib/contributors";
import { getJobs } from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo";
import { categoryLabels, siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
} from "@heyclaude/registry/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Claude ecosystem board",
  description:
    "Track Claude ecosystem releases, package updates, events, community notes, and HeyClaude registry signals in one planning surface.",
  path: "/ecosystem",
});

function formatDate(value?: string) {
  if (!value) return "Recently";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export default async function EcosystemPage() {
  const [manifest, changelog, trustReport, contributors, jobs] =
    await Promise.all([
      getRegistryManifest(),
      getRegistryChangelog(),
      getRegistryTrustReport(),
      getContributors(),
      getJobs(),
    ]);
  const recentDrops = changelog.entries.slice(0, 8);
  const ugcContributors = contributors
    .filter((contributor) =>
      contributor.entries.some((entry) => Boolean(entry.submittedBy)),
    )
    .slice(0, 6);
  const activeJobs = jobs.slice(0, 4);
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Ecosystem", url: `${siteConfig.url}/ecosystem` },
    ]),
    buildCollectionPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/ecosystem",
      name: "Claude ecosystem board",
      description:
        "News, releases, jobs, and community updates generated from the HeyClaude registry and review workflow.",
      breadcrumbId: `${siteConfig.url}/ecosystem#breadcrumb`,
    }),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Ecosystem" }]}
        />
        <span className="eyebrow">Ecosystem</span>
        <h1 className="section-title">Claude ecosystem updates.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          Registry drops, contributor activity, jobs, release channels, and
          trust signals generated from reviewed HeyClaude data.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Registry entries", manifest.totalEntries, "Reviewed resources"],
          [
            "Brand coverage",
            `${trustReport.summary.brandedPercent}%`,
            `${trustReport.summary.brandedCount}/${trustReport.count} entries`,
          ],
          ["Active jobs", activeJobs.length, "External apply paths"],
          ["Contributors", contributors.length, "Public registry authors"],
        ].map(([label, value, note]) => (
          <article key={label} className="surface-panel p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <div className="surface-panel p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Latest registry drops
            </h2>
            <Link
              href="/data/registry-changelog.json"
              className="text-sm font-medium text-primary underline underline-offset-4"
            >
              Changelog
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {recentDrops.map((entry) => (
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
                    {formatDate(entry.dateAdded)}
                  </span>
                </span>
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                  added
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="surface-panel p-5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Release channels
          </h2>
          <div className="mt-4 space-y-2">
            {[
              ["Raycast", "/data/raycast-index.json"],
              ["MCP", "/mcp"],
              ["API", "/api-docs"],
              ["Feeds", "/api/registry/feed"],
              ["LLM export", "/llms.txt"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="block rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/50"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface-panel p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Contributor highlights
            </h2>
            <Link
              href="/contributors"
              className="text-sm font-medium text-primary underline underline-offset-4"
            >
              Contributors
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {ugcContributors.length ? (
              ugcContributors.map((contributor) => (
                <Link
                  key={contributor.slug}
                  href={`/contributors/${contributor.slug}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3 text-sm transition hover:border-primary/50"
                >
                  <span className="font-medium text-foreground">
                    {contributor.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {contributor.entryCount} entr
                    {contributor.entryCount === 1 ? "y" : "ies"}
                  </span>
                </Link>
              ))
            ) : (
              <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                Community submission highlights appear after reviewed UGC
                entries are imported.
              </p>
            )}
          </div>
        </div>

        <div className="surface-panel p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Jobs board updates
            </h2>
            <Link
              href="/jobs"
              className="text-sm font-medium text-primary underline underline-offset-4"
            >
              Jobs
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {activeJobs.length ? (
              activeJobs.map((job) => (
                <Link
                  key={job.slug}
                  href={`/jobs/${job.slug}`}
                  className="block rounded-xl border border-border bg-background px-4 py-3 text-sm transition hover:border-primary/50"
                >
                  <span className="block truncate font-medium text-foreground">
                    {job.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {job.company} - {job.location}
                  </span>
                </Link>
              ))
            ) : (
              <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                Reviewed AI, MCP, and Claude ecosystem jobs appear here when
                active.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="surface-panel p-5 text-sm leading-7 text-muted-foreground">
        Submit Claude resources through{" "}
        <Link
          href="/submit"
          className="text-primary underline underline-offset-4"
        >
          the content flow
        </Link>
        , use{" "}
        <Link
          href="/tools/submit"
          className="text-primary underline underline-offset-4"
        >
          tools intake
        </Link>
        , or{" "}
        <Link
          href="/jobs/post"
          className="text-primary underline underline-offset-4"
        >
          post a reviewed job
        </Link>
        .
      </section>
    </div>
  );
}
