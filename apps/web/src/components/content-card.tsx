import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  Copy,
  Download,
  Eye,
  FileText
} from "lucide-react";

import type { ContentEntry } from "@/lib/content";
import {
  categoryLabels,
  categoryPillClasses,
  categoryTileClasses
} from "@/lib/site";

type ContentCardProps = {
  entry: ContentEntry;
};

export function ContentCard({ entry }: ContentCardProps) {
  const metrics = [
    typeof entry.viewCount === "number"
      ? { icon: Eye, label: `${entry.viewCount}` }
      : null,
    entry.readingTime
      ? { icon: Clock3, label: `${entry.readingTime} min` }
      : null,
    typeof entry.copyCount === "number"
      ? { icon: Copy, label: `${entry.copyCount} copies` }
      : null
  ].filter(Boolean) as Array<{ icon: typeof Clock3; label: string }>;

  return (
    <article className="directory-card group rounded-[1rem] border border-[var(--line)] p-5">
      <div className="flex gap-4">
        <div className="flex w-12 shrink-0 flex-col items-center justify-between rounded-[0.8rem] border border-[var(--line)] bg-[color:color-mix(in_oklab,var(--bg)_88%,var(--panel-strong))] px-2 py-3 text-center">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${categoryTileClasses[entry.category] ?? "from-[var(--panel)] to-transparent text-[var(--ink)]"}`}
          >
            <span className="text-[11px] font-semibold tracking-[-0.06em]">
              {(categoryLabels[entry.category] ?? entry.category).slice(0, 2)}
            </span>
          </div>
          <div className="space-y-1 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
            <p>{typeof entry.viewCount === "number" ? entry.viewCount : "new"}</p>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className={`rounded-full border px-3 py-1 text-[0.72rem] font-medium uppercase tracking-[0.16em] ${categoryPillClasses[entry.category] ?? "border-[var(--line)] bg-[var(--panel-strong)] text-[var(--muted)]"}`}
            >
              {categoryLabels[entry.category] ?? entry.category}
            </span>
            {entry.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--line)] bg-[color-mix(in_oklab,var(--panel-strong)_92%,transparent)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--muted)]"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <Link
                  href={`/${entry.category}/${entry.slug}`}
                  className="inline-flex items-start gap-2 text-[1.18rem] font-semibold tracking-[-0.03em]"
                >
                  <span>{entry.title}</span>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[var(--muted)] transition group-hover:text-[var(--ink)]" />
                </Link>
                <p className="text-xs text-[var(--muted)]">
                  {entry.author ? `By ${entry.author}` : "Community submission"}
                  {entry.dateAdded ? ` • Added ${entry.dateAdded}` : ""}
                </p>
              </div>
              {typeof entry.viewCount === "number" ? (
                <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
                  <Eye className="h-3.5 w-3.5" />
                  {entry.viewCount}
                </div>
              ) : null}
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
              {entry.description}
            </p>
          </div>

          <div className="directory-command-bar flex flex-wrap items-center justify-between gap-3 rounded-[0.8rem] border border-[var(--line)] px-3 py-2">
            <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--accent)]">
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {entry.documentationUrl
                  ? "Open docs for instructions"
                  : entry.downloadUrl
                    ? "Download the package"
                    : "Open this entry on HeyClaude"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.documentationUrl ? (
                <a
                  href={entry.documentationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="directory-mini-button"
                >
                  Docs
                </a>
              ) : null}
              {entry.downloadUrl ? (
                <a
                  href={entry.downloadUrl}
                  className="directory-mini-button"
                >
                  Download
                </a>
              ) : null}
              <Link
                href={`/${entry.category}/${entry.slug}`}
                className="directory-mini-button"
              >
                Open
              </Link>
            </div>
          </div>

          {metrics.length ? (
            <div className="flex flex-wrap gap-2.5">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <span
                    key={metric.label}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[color:color-mix(in_oklab,var(--panel-strong)_92%,transparent)] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {metric.label}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
