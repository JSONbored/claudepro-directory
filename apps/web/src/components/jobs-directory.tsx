"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";

import { SearchBar } from "@/components/search-bar";
import type { JobListing } from "@/lib/jobs";

type JobsDirectoryProps = {
  jobs: JobListing[];
  initialQuery?: string;
};

export function JobsDirectory({
  jobs,
  initialQuery = ""
}: JobsDirectoryProps) {
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredJobs = normalizedQuery
    ? jobs.filter((job) =>
        [job.title, job.company, job.location, job.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      )
    : jobs;

  return (
    <div className="space-y-6">
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search roles, companies, locations, or keywords..."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          {filteredJobs.length} role{filteredJobs.length === 1 ? "" : "s"}
        </p>
        {normalizedQuery ? (
          <p className="text-sm text-[var(--muted)]">
            Filtering for <span className="text-[var(--ink)]">“{deferredQuery}”</span>
          </p>
        ) : null}
      </div>

      <div className="grid gap-5">
        {filteredJobs.length ? (
          filteredJobs.map((job) => (
            <article key={job.slug} className="panel rounded-[1.75rem] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.15em] text-[var(--muted)]">
                    {job.company}
                  </p>
                  <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                    {job.title}
                  </h2>
                  <p className="text-sm leading-7 text-[var(--muted)]">
                    {job.location}
                  </p>
                </div>
                {job.featured ? (
                  <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs uppercase tracking-[0.1em] text-[var(--bg)]">
                    Featured
                  </span>
                ) : null}
              </div>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                {job.description}
              </p>
              <div className="mt-6">
                <Link href={job.applyUrl} className="link-button link-button-primary">
                  View role
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="panel rounded-[1.75rem] p-8 text-sm leading-7 text-[var(--muted)]">
            No roles matched that search yet. Try a company, location, or broader
            keyword.
          </div>
        )}
      </div>
    </div>
  );
}
