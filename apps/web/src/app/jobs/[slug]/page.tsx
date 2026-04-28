import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  MapPin,
  Wallet,
} from "lucide-react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { getJobBySlug } from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildJobPostingJsonLd,
  buildWebPageJsonLd,
} from "@heyclaude/registry/seo";

export const dynamic = "force-dynamic";

type JobDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) {
    return buildPageMetadata({
      title: "Job listing not found",
      description: "The requested job listing could not be found.",
      path: `/jobs/${slug}`,
      robots: { index: false, follow: false },
    });
  }

  const keywords = [
    "claude jobs",
    "ai jobs",
    job.company,
    job.location,
    job.type,
  ].filter((value): value is string => Boolean(value));

  return buildPageMetadata({
    title: `${job.title} at ${job.company}`,
    description: buildJobSeoDescription(job),
    path: `/jobs/${job.slug}`,
    keywords,
  });
}

function formatDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getJobLabels(job: Awaited<ReturnType<typeof getJobBySlug>>) {
  if (!job) return [];
  const labels = [];
  if (job.sponsored) labels.push("Sponsored");
  else if (job.featured) labels.push("Featured");
  if (job.claimedEmployer) labels.push("Claimed employer");
  labels.push(
    job.source === "curated" || job.sourceKind === "official_ats"
      ? "Editorially curated"
      : "Employer submitted",
  );
  return labels;
}

function buildJobSeoDescription(job: Awaited<ReturnType<typeof getJobBySlug>>) {
  if (!job) return "The requested job listing could not be found.";
  const suffix =
    "HeyClaude lists external-apply AI, Claude, MCP, and agent workflow roles with source verification.";
  const description = `${job.description} ${suffix}`;
  return description.length > 165
    ? `${description.slice(0, 162).trimEnd()}...`
    : description;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Jobs", url: `${siteConfig.url}/jobs` },
      {
        name: `${job.title} at ${job.company}`,
        url: `${siteConfig.url}/jobs/${job.slug}`,
      },
    ]),
    buildWebPageJsonLd({
      siteUrl: siteConfig.url,
      path: `/jobs/${job.slug}`,
      name: `${job.title} at ${job.company}`,
      description: buildJobSeoDescription(job),
      breadcrumbId: `${siteConfig.url}/jobs/${job.slug}#breadcrumb`,
    }),
    buildJobPostingJsonLd(job, { siteUrl: siteConfig.url }),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Jobs", href: "/jobs" },
            { label: `${job.title} at ${job.company}` },
          ]}
        />
        <Link href="/jobs" className="eyebrow">
          Jobs
        </Link>
        <h1 className="section-title text-balance">{job.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {getJobLabels(job).map((label) => (
            <span
              key={label}
              className={
                label === "Sponsored"
                  ? "inline-flex items-center gap-1.5 rounded-full border border-primary/45 bg-primary/12 px-3 py-1 text-primary"
                  : "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1"
              }
            >
              {label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
            <Building2 className="size-3.5" />
            {job.company}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
            <MapPin className="size-3.5" />
            {job.location}
          </span>
          {job.postedAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
              <CalendarDays className="size-3.5" />
              {formatDate(job.postedAt)}
            </span>
          ) : null}
          {job.compensation ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
              <Wallet className="size-3.5" />
              {job.compensation}
            </span>
          ) : null}
        </div>
      </div>

      <article className="surface-panel space-y-6 p-6">
        <p className="text-sm leading-7 text-muted-foreground">
          {job.description}
        </p>

        <section className="grid gap-3 text-sm md:grid-cols-3">
          {job.companyUrl ? (
            <a
              href={job.companyUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-border bg-background/80 px-3 py-2 text-foreground transition hover:border-primary/35"
            >
              Company site
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                {job.companyUrl}
              </span>
            </a>
          ) : null}
          {job.sourceUrl ? (
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-border bg-background/80 px-3 py-2 text-foreground transition hover:border-primary/35"
            >
              Source listing
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                {job.sourceKind === "official_ats"
                  ? "Official ATS page"
                  : "Employer source"}
              </span>
            </a>
          ) : null}
          {job.sourceCheckedAt || job.lastCheckedAt ? (
            <div className="rounded-xl border border-border bg-background/80 px-3 py-2 text-foreground">
              Last verified
              <span className="mt-1 block text-xs text-muted-foreground">
                {formatDate(job.sourceCheckedAt || job.lastCheckedAt)}
              </span>
            </div>
          ) : null}
        </section>

        {job.curationNote ? (
          <p className="rounded-xl border border-border bg-background/80 px-3 py-2 text-sm leading-7 text-muted-foreground">
            {job.curationNote}
          </p>
        ) : null}

        {job.responsibilities?.length ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Responsibilities
            </h2>
            <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
              {job.responsibilities.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-border/80 bg-background/80 px-3 py-2"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {job.requirements?.length ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Requirements
            </h2>
            <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
              {job.requirements.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-border/80 bg-background/80 px-3 py-2"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={job.applyUrl}
          target={job.applyUrl.startsWith("http") ? "_blank" : undefined}
          rel={job.applyUrl.startsWith("http") ? "noreferrer" : undefined}
          className="inline-flex items-center rounded-full border border-primary/35 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <ArrowUpRight className="mr-1.5 size-4" />
          Apply now
        </a>
        <Link
          href={`/jobs/post?tier=${job.tier || "standard"}`}
          className="inline-flex items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/35"
        >
          Post a job
        </Link>
      </div>
    </div>
  );
}
