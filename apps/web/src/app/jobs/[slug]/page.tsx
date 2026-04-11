import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Building2, CalendarDays, MapPin, Wallet } from "lucide-react";

import { getJobBySlug } from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type JobDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) {
    return buildPageMetadata({
      title: "Job listing not found",
      description: "The requested job listing could not be found.",
      path: `/jobs/${slug}`,
      robots: { index: false, follow: false }
    });
  }

  const keywords = [
    "claude jobs",
    "ai jobs",
    job.company,
    job.location,
    job.type
  ].filter((value): value is string => Boolean(value));

  return buildPageMetadata({
    title: `${job.title} at ${job.company}`,
    description: job.description,
    path: `/jobs/${job.slug}`,
    keywords
  });
}

function formatDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  return (
    <div className="container-shell space-y-8 py-12">
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Link href="/jobs" className="eyebrow">
          Jobs
        </Link>
        <h1 className="section-title text-balance">{job.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
        <p className="text-sm leading-7 text-muted-foreground">{job.description}</p>

        {job.responsibilities?.length ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Responsibilities</h2>
            <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
              {job.responsibilities.map((item) => (
                <li key={item} className="rounded-xl border border-border/80 bg-background/80 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {job.requirements?.length ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Requirements</h2>
            <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
              {job.requirements.map((item) => (
                <li key={item} className="rounded-xl border border-border/80 bg-background/80 px-3 py-2">
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
          href="/jobs/post"
          className="inline-flex items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/35"
        >
          Post a job
        </Link>
      </div>
    </div>
  );
}
