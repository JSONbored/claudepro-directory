"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { SearchBar } from "@/components/search-bar";
import type { JobListing } from "@/lib/jobs";

type JobsDirectoryProps = {
  jobs: JobListing[];
};

function getJobLabels(job: JobListing) {
  const labels = [];
  if (job.sponsored) labels.push("Sponsored");
  else if (job.featured) labels.push("Featured");

  if (job.claimedEmployer) labels.push("Claimed employer");
  if (job.source === "curated" || job.sourceKind === "official_ats") {
    labels.push("Editorially curated");
  } else {
    labels.push("Employer submitted");
  }

  return labels;
}

export function JobsDirectory({ jobs }: JobsDirectoryProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const hasJobs = jobs.length > 0;

  const filteredJobs = useMemo(() => {
    if (!normalizedQuery) return jobs;

    return jobs.filter((job) =>
      [
        job.title,
        job.company,
        job.location,
        job.description,
        job.compensation,
        job.equity,
        job.bonus,
        ...(job.benefits || []),
        ...(job.responsibilities || []),
        ...(job.requirements || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [jobs, normalizedQuery]);

  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((left, right) => {
      const leftScore =
        Number(Boolean(left.sponsored)) * 2 + Number(Boolean(left.featured));
      const rightScore =
        Number(Boolean(right.sponsored)) * 2 + Number(Boolean(right.featured));
      return rightScore - leftScore;
    });
  }, [filteredJobs]);

  const formatPosted = (value?: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-5">
      <div className="max-w-3xl">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search jobs, companies, locations..."
        />
      </div>

      <div className="text-sm text-muted-foreground">
        {sortedJobs.length} hiring{" "}
        {sortedJobs.length === 1 ? "listing" : "listings"} found
      </div>
      <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
        Every listing is reviewed before it appears here, checked against the
        employer source, and routed to the canonical external application page.
      </p>

      <div className="space-y-4">
        {sortedJobs.map((job) => (
          <article
            key={job.slug}
            className={
              job.sponsored
                ? "surface-panel border-primary/45 bg-card p-6 shadow-lg"
                : "surface-panel p-6"
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {getJobLabels(job).map((label) => (
                    <span
                      key={label}
                      className={
                        label === "Sponsored"
                          ? "inline-flex rounded-full border border-primary/45 bg-primary/12 px-2.5 py-0.5 text-[11px] font-medium text-primary"
                          : "inline-flex rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground"
                      }
                    >
                      {label}
                    </span>
                  ))}
                  <span>{job.company}</span>
                  {job.type ? <span>· {job.type}</span> : null}
                  <span>· {job.location}</span>
                  {job.postedAt ? (
                    <span>· {formatPosted(job.postedAt)}</span>
                  ) : null}
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {job.title}
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                  {job.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                    Salary: {job.compensation || "not published"}
                  </span>
                  {job.equity ? (
                    <span className="inline-flex rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                      Equity: {job.equity}
                    </span>
                  ) : null}
                  {job.bonus ? (
                    <span className="inline-flex rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                      Bonus: {job.bonus}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/jobs/${job.slug}`}
                  className="directory-link-chip"
                >
                  Details
                </Link>
                <a
                  href={job.applyUrl}
                  className="directory-link-chip"
                  target={
                    job.applyUrl.startsWith("http") ? "_blank" : undefined
                  }
                  rel={
                    job.applyUrl.startsWith("http") ? "noreferrer" : undefined
                  }
                >
                  <ArrowUpRight className="size-3.5" />
                  Apply
                </a>
              </div>
            </div>
          </article>
        ))}

        {sortedJobs.length === 0 ? (
          <div className="surface-panel space-y-4 p-8 text-sm text-muted-foreground">
            <div>
              <p className="text-base font-medium text-foreground">
                {hasJobs
                  ? "No jobs matched that search."
                  : "No active jobs yet."}
              </p>
              <p className="mt-2 max-w-2xl leading-7">
                {hasJobs
                  ? "Try another company, location, or role keyword."
                  : "Posting options are available while the board is empty."}
              </p>
            </div>
            {!hasJobs ? (
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/jobs/post?tier=free"
                  className="directory-link-chip"
                >
                  Free founding role
                </Link>
                <Link
                  href="/jobs/post?tier=sponsored"
                  className="directory-link-chip"
                >
                  Sponsored slot
                </Link>
                <Link
                  href="/jobs/post?tier=featured"
                  className="directory-link-chip"
                >
                  Featured job
                </Link>
                <Link
                  href="/jobs/post?tier=standard"
                  className="directory-link-chip"
                >
                  Standard job
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
