"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { SearchBar } from "@/components/search-bar";
import type { JobListing } from "@/lib/jobs";

type JobsDirectoryProps = {
  jobs: JobListing[];
};

export function JobsDirectory({ jobs }: JobsDirectoryProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredJobs = useMemo(() => {
    if (!normalizedQuery) return jobs;

    return jobs.filter((job) =>
      [job.title, job.company, job.location, job.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [jobs, normalizedQuery]);

  return (
    <div className="space-y-5">
      <div className="max-w-3xl">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search jobs, companies, locations..."
        />
      </div>

      <div className="text-sm text-muted-foreground">{filteredJobs.length} jobs found</div>

      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <article key={job.slug} className="surface-panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                    {job.featured ? "Featured" : "Role"}
                  </span>
                  <span>{job.company}</span>
                  <span>· {job.location}</span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {job.title}
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                  {job.description}
                </p>
              </div>
              <a
                href={job.applyUrl}
                className="directory-link-chip"
                target={job.applyUrl.startsWith("http") ? "_blank" : undefined}
                rel={job.applyUrl.startsWith("http") ? "noreferrer" : undefined}
              >
                <ArrowUpRight className="size-3.5" />
                View
              </a>
            </div>
          </article>
        ))}

        {filteredJobs.length === 0 ? (
          <div className="surface-panel p-8 text-sm text-muted-foreground">
            No jobs matched that search.
          </div>
        ) : null}
      </div>
    </div>
  );
}
