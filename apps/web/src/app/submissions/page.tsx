import type { Metadata } from "next";
import Link from "next/link";
import { buildSubmissionQueue } from "@heyclaude/registry/submission";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
} from "@heyclaude/registry/seo";

type GitHubIssue = {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  updated_at: string;
  user?: {
    login?: string;
  };
  labels: Array<string | { name?: string }>;
  pull_request?: unknown;
};

export const dynamic = "force-dynamic";
export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Submission queue",
  description:
    "Track open HeyClaude content submissions that are import-ready or need changes.",
  path: "/submissions",
  keywords: ["heyclaude submissions", "claude resource submission queue"],
});

async function getSubmissionQueue() {
  try {
    const response = await fetch(
      "https://api.github.com/repos/JSONbored/claudepro-directory/issues?state=open&per_page=100",
      {
        headers: {
          accept: "application/vnd.github+json",
          "user-agent": "heyclaude-submission-queue",
        },
        next: { revalidate: 300 },
      },
    );

    if (!response.ok) {
      return {
        available: false,
        error: `GitHub responded with ${response.status}`,
        queue: buildSubmissionQueue([]),
      };
    }

    const issues = ((await response.json()) as GitHubIssue[])
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body || "",
        url: issue.html_url,
        updatedAt: issue.updated_at,
        author: issue.user?.login || "",
        labels: issue.labels,
      }));

    return {
      available: true,
      error: "",
      queue: buildSubmissionQueue(issues),
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : "Unknown queue error",
      queue: buildSubmissionQueue([]),
    };
  }
}

function statusLabel(status: string) {
  if (status === "import_ready") return "Import ready";
  if (status === "needs_changes") return "Needs changes";
  return "Skipped";
}

export default async function SubmissionsPage() {
  const { available, error, queue } = await getSubmissionQueue();
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Submissions", url: `${siteConfig.url}/submissions` },
    ]),
    buildCollectionPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/submissions",
      name: "Submission queue",
      description:
        "Open content submissions grouped by import readiness and validation status.",
      breadcrumbId: `${siteConfig.url}/submissions#breadcrumb`,
    }),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Submissions" }]}
        />
        <span className="eyebrow">Submission queue</span>
        <h1 className="section-title">Submission queue.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          This page runs open public GitHub issues through the same registry
          submission queue contract used by CI. Accepted submissions require
          maintainer approval before automation opens a content import PR for
          review.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/submit"
            className="inline-flex items-center rounded-full border border-primary/40 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Submit free resource
          </Link>
          <a
            href={`${siteConfig.githubUrl}/issues?q=is%3Aissue+is%3Aopen+label%3Acontent-submission`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
          >
            Open GitHub queue
          </a>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Import ready", queue.summary.importReady],
          ["Needs changes", queue.summary.needsChanges],
          ["Tracked issues", queue.count],
        ].map(([label, value]) => (
          <div key={label} className="surface-panel p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-primary">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {value}
            </p>
          </div>
        ))}
      </section>

      {!available ? (
        <section className="surface-panel p-5 text-sm leading-7 text-muted-foreground">
          GitHub issue status is temporarily unavailable: {error}. Use the
          GitHub queue link above for the current source of truth.
        </section>
      ) : null}

      <section className="space-y-3">
        {queue.entries.length ? (
          queue.entries.map((entry) => (
            <article key={entry.number} className="surface-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">
                    {statusLabel(entry.status)}
                  </p>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary"
                    >
                      #{entry.number} {entry.title}
                    </a>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {entry.category || "unknown"} / {entry.slug || "no slug"}
                  </p>
                </div>
                {entry.importPath ? (
                  <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                    {entry.importPath}
                  </span>
                ) : null}
              </div>
              {entry.errors.length ? (
                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm leading-7 text-muted-foreground">
                  {entry.errors.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))
        ) : (
          <section className="surface-panel p-8 text-sm leading-7 text-muted-foreground">
            No open submission-shaped issues are currently tracked.
          </section>
        )}
      </section>
    </div>
  );
}
