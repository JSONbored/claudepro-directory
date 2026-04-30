import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { JobsDirectory } from "@/components/jobs-directory";
import { getJobs } from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
} from "@heyclaude/registry/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Claude jobs board",
  description:
    "Browse curated and reviewed external-apply jobs for teams building with Claude, MCP infrastructure, agents, developer tools, and AI workflows.",
  path: "/jobs",
  keywords: ["claude jobs", "ai jobs", "mcp jobs", "llm engineer jobs"],
  imageLabel: "Jobs",
  imageKind: "job",
});

export default async function JobsPage() {
  const jobs = await getJobs();
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Jobs", url: `${siteConfig.url}/jobs` },
    ]),
    buildCollectionPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/jobs",
      name: "Claude jobs board",
      description:
        "Hiring roles for teams building with Claude and AI-native workflows.",
      breadcrumbId: `${siteConfig.url}/jobs#breadcrumb`,
    }),
    buildItemListJsonLd(
      jobs.map((job) => ({
        name: `${job.title} at ${job.company}`,
        url: `${siteConfig.url}/jobs/${job.slug}`,
      })),
      {
        name: "HeyClaude jobs",
        description:
          "Hiring roles for teams building with Claude and AI-native workflows.",
      },
    ),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Jobs" }]}
        />
        <span className="eyebrow">Jobs</span>
        <h1 className="section-title">Hiring roles for Claude builders.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          Real hiring opportunities for teams shipping Claude-native products,
          agents, MCP infrastructure, and AI workflow systems.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href="/jobs/post?tier=free"
            className="inline-flex items-center rounded-full border border-primary/40 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Post free founding role
          </a>
          <a
            href="/jobs/post?tier=sponsored"
            className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
          >
            Post sponsored hiring slot
          </a>
          <a
            href="/jobs/post?tier=featured"
            className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
          >
            Post featured job
          </a>
          <a
            href="/jobs/post?tier=standard"
            className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
          >
            Post standard job
          </a>
        </div>
      </div>
      <JobsDirectory jobs={jobs} />

      <section className="surface-panel grid gap-3 p-5 md:grid-cols-4">
        <a
          href="/jobs/post?tier=free"
          className="rounded-xl border border-primary/35 bg-primary/10 px-4 py-3 transition hover:border-primary/55"
        >
          <p className="text-xs uppercase tracking-[0.14em] text-primary">
            Founding standard
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            Free during launch
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            First 25 approved employer roles or first 60 days.
          </p>
        </a>
        <a
          href="/jobs/post?tier=standard"
          className="rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/40"
        >
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Standard
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            $49 / 30 days
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Main feed listing with a full detail page.
          </p>
        </a>
        <a
          href="/jobs/post?tier=featured"
          className="rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/40"
        >
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Featured
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            $49 launch, then $99
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Priority ordering and highlighted card treatment.
          </p>
        </a>
        <a
          href="/jobs/post?tier=sponsored"
          className="rounded-xl border border-primary/35 bg-primary/10 px-4 py-3 transition hover:border-primary/55"
        >
          <p className="text-xs uppercase tracking-[0.14em] text-primary">
            Sponsored
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            $149 launch, then $249
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pinned premium slot for maximum visibility.
          </p>
        </a>
      </section>
    </div>
  );
}
