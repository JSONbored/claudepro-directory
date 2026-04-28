import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  BriefcaseBusiness,
  ExternalLink,
  Gift,
  MapPin,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { getJobBySlug, getJobs, type JobListing } from "@/lib/jobs";
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

type JobDetail = JobListing;

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
    imageLabel: "Job",
    imageKind: "job",
    imageBadge: job.company,
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

function getJobLabels(job: JobDetail) {
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
  const compensation = job.compensation ? ` Salary: ${job.compensation}.` : "";
  const equity = job.equity ? ` Equity: ${job.equity}.` : "";
  const description = `${job.title} at ${job.company} in ${job.location}.${compensation}${equity} ${job.description}`;
  if (description.length <= 165) return description;
  const trimmed = description
    .slice(0, 165)
    .replace(/\s+\S*$/, "")
    .trimEnd();
  return trimmed.length >= 120 ? trimmed : description.slice(0, 165).trimEnd();
}

function formatUrlHost(value?: string) {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function getSourceKindLabel(job: JobDetail) {
  if (job.sourceKind === "official_ats") return "Official ATS page";
  if (job.sourceKind === "employer_careers") return "Employer careers page";
  return "Employer source";
}

type JobDetailsBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

function parseJobDetails(value?: string): JobDetailsBlock[] {
  const text = String(value || "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!text) return [];

  const blocks: JobDetailsBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ kind: "paragraph", text: paragraph.join(" ").trim() });
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    blocks.push({ kind: "list", items: list });
    list = [];
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^#{2,3}\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "heading", text: heading[1].trim() });
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1].trim());
      continue;
    }

    flushList();
    paragraph.push(line.replace(/^#+\s*/, ""));
  }

  flushParagraph();
  flushList();
  return blocks;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const jobs = await getJobs();
  const job = jobs.find((item) => item.slug === slug) ?? null;
  if (!job) notFound();
  const relatedJobs = jobs.filter((item) => item.slug !== job.slug).slice(0, 3);
  const verifiedAt = job.sourceCheckedAt || job.lastCheckedAt;
  const activeThrough = formatDate(job.expiresAt);
  const companyHost = formatUrlHost(job.companyUrl);
  const sourceHost = formatUrlHost(job.sourceUrl);
  const detailBlocks = parseJobDetails(job.descriptionMd);
  const salaryLabel = job.compensation || "Not published by employer";
  const trustItems = [
    {
      label: "Source",
      value: sourceHost || getSourceKindLabel(job),
    },
    {
      label: "Verified",
      value: verifiedAt ? formatDate(verifiedAt) : "Pending recheck",
    },
    {
      label: "Compensation",
      value: job.compensation ? "Published" : "Not published",
    },
    {
      label: "Apply path",
      value: "External employer site",
    },
  ];
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
    <div className="container-shell space-y-8 py-10 md:py-12">
      <JsonLd data={jsonLd} />
      <section className="grid gap-7 border-b border-border/80 pb-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div className="space-y-4">
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
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
              <Building2 className="size-4" />
              {job.company}
            </p>
            <h1 className="section-title max-w-4xl text-balance">
              {job.title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted-foreground">
              {job.description}
            </p>
          </div>
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
                {label === "Editorially curated" ? (
                  <ShieldCheck className="size-3.5" />
                ) : null}
                {label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
              <MapPin className="size-3.5" />
              {job.location}
            </span>
            {job.type ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
                <BriefcaseBusiness className="size-3.5" />
                {job.type}
              </span>
            ) : null}
            {job.postedAt ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
                <CalendarDays className="size-3.5" />
                {formatDate(job.postedAt)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
              <Wallet className="size-3.5" />
              {salaryLabel}
            </span>
            {job.equity ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
                <Sparkles className="size-3.5" />
                Equity: {job.equity}
              </span>
            ) : null}
            {job.bonus ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
                <Gift className="size-3.5" />
                Bonus: {job.bonus}
              </span>
            ) : null}
          </div>
        </div>

        <aside className="surface-panel p-4">
          <a
            href={job.applyUrl}
            target={job.applyUrl.startsWith("http") ? "_blank" : undefined}
            rel={job.applyUrl.startsWith("http") ? "noreferrer" : undefined}
            className="inline-flex w-full items-center justify-center rounded-full border border-primary/35 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <ArrowUpRight className="mr-1.5 size-4" />
            Apply on employer site
          </a>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-3">
              <span className="text-muted-foreground">Company</span>
              <span className="text-right font-medium text-foreground">
                {job.company}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-3">
              <span className="text-muted-foreground">Location</span>
              <span className="text-right font-medium text-foreground">
                {job.location}
              </span>
            </div>
            {job.type ? (
              <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-3">
                <span className="text-muted-foreground">Type</span>
                <span className="text-right font-medium text-foreground">
                  {job.type}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-3">
              <span className="text-muted-foreground">Salary</span>
              <span className="text-right font-medium text-foreground">
                {salaryLabel}
              </span>
            </div>
            {job.equity ? (
              <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-3">
                <span className="text-muted-foreground">Equity</span>
                <span className="text-right font-medium text-foreground">
                  {job.equity}
                </span>
              </div>
            ) : null}
            {job.bonus ? (
              <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-3">
                <span className="text-muted-foreground">Bonus</span>
                <span className="text-right font-medium text-foreground">
                  {job.bonus}
                </span>
              </div>
            ) : null}
            {verifiedAt ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Verified</span>
                <span className="text-right font-medium text-foreground">
                  {formatDate(verifiedAt)}
                </span>
              </div>
            ) : null}
          </div>
        </aside>
      </section>

      <section
        aria-label="Listing trust summary"
        className="grid gap-3 rounded-2xl border border-border bg-card/70 p-3 md:grid-cols-4"
      >
        {trustItems.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border/80 bg-background/70 px-4 py-3"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <article className="space-y-5">
          <section className="surface-panel space-y-4 p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <BadgeCheck className="size-4 text-primary" />
              Role summary
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              {job.description}
            </p>
            {job.curationNote ? (
              <div className="border-l border-primary/45 pl-4 text-sm leading-7 text-muted-foreground">
                {job.curationNote}
              </div>
            ) : null}
          </section>

          {detailBlocks.length ? (
            <section className="surface-panel space-y-4 p-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Role details
              </h2>
              <div className="space-y-4">
                {detailBlocks.map((block, index) => {
                  if (block.kind === "heading") {
                    return (
                      <h3
                        key={`${block.kind}-${index}`}
                        className="pt-2 text-sm font-semibold uppercase tracking-[0.14em] text-primary"
                      >
                        {block.text}
                      </h3>
                    );
                  }
                  if (block.kind === "list") {
                    return (
                      <ul
                        key={`${block.kind}-${index}`}
                        className="space-y-3 text-sm leading-7 text-muted-foreground"
                      >
                        {block.items.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span
                              className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary"
                              aria-hidden
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p
                      key={`${block.kind}-${index}`}
                      className="text-sm leading-7 text-muted-foreground"
                    >
                      {block.text}
                    </p>
                  );
                })}
              </div>
            </section>
          ) : null}

          {job.benefits?.length ? (
            <section className="surface-panel space-y-4 p-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Benefits and perks
              </h2>
              <ul className="grid gap-3 text-sm leading-7 text-muted-foreground md:grid-cols-2">
                {job.benefits.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {job.responsibilities?.length ? (
            <section className="surface-panel space-y-4 p-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Responsibilities
              </h2>
              <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                {job.responsibilities.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {job.requirements?.length ? (
            <section className="surface-panel space-y-4 p-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Requirements
              </h2>
              <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                {job.requirements.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {!detailBlocks.length &&
          !job.responsibilities?.length &&
          !job.requirements?.length ? (
            <section className="surface-panel space-y-3 p-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Listing scope
              </h2>
              <p className="text-sm leading-7 text-muted-foreground">
                This curated listing has not been expanded yet. HeyClaude points
                candidates to the canonical employer page for the full role
                description, interview process, and application requirements.
              </p>
            </section>
          ) : null}
        </article>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className="surface-panel space-y-4 p-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Official links
              </h2>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                Applications stay on the employer or ATS page.
              </p>
            </div>
            <div className="space-y-2">
              {job.companyUrl ? (
                <a
                  href={job.companyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/80 px-3 py-2.5 text-sm transition hover:border-primary/35"
                >
                  <span>
                    <span className="block font-medium text-foreground">
                      Company site
                    </span>
                    {companyHost ? (
                      <span className="block max-w-[14rem] truncate text-xs text-muted-foreground">
                        {companyHost}
                      </span>
                    ) : null}
                  </span>
                  <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                </a>
              ) : null}
              {job.sourceUrl ? (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/80 px-3 py-2.5 text-sm transition hover:border-primary/35"
                >
                  <span>
                    <span className="block font-medium text-foreground">
                      Source listing
                    </span>
                    <span className="block max-w-[14rem] truncate text-xs text-muted-foreground">
                      {sourceHost || getSourceKindLabel(job)}
                    </span>
                  </span>
                  <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                </a>
              ) : null}
            </div>
          </section>

          <section className="surface-panel space-y-3 p-5 text-sm">
            <h2 className="text-sm font-semibold text-foreground">
              Listing trust
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{getSourceKindLabel(job)}</span>
              </div>
              {verifiedAt ? (
                <div className="flex items-start gap-2.5">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>Last checked {formatDate(verifiedAt)}</span>
                </div>
              ) : null}
              {activeThrough ? (
                <div className="flex items-start gap-2.5">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>Active through {activeThrough}</span>
                </div>
              ) : null}
            </div>
          </section>

          <Link
            href={`/jobs/post?tier=${job.tier || "standard"}`}
            className="inline-flex w-full items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/35"
          >
            Post a job
          </Link>
        </aside>
      </div>

      {relatedJobs.length ? (
        <section className="surface-panel space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                More current roles
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Reviewed external-apply listings from the HeyClaude jobs board.
              </p>
            </div>
            <Link href="/jobs" className="directory-link-chip">
              View all jobs
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {relatedJobs.map((relatedJob) => (
              <Link
                key={relatedJob.slug}
                href={`/jobs/${relatedJob.slug}`}
                className="rounded-xl border border-border bg-background/80 p-4 transition hover:border-primary/40"
              >
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
                  {relatedJob.company}
                </p>
                <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-foreground">
                  {relatedJob.title}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  {relatedJob.location}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
