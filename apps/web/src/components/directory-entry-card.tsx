"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronUp, Copy, ExternalLink, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ContentEntry } from "@/lib/content";
import { cn } from "@/lib";
import { categoryAccentClasses, categoryLabels } from "@/lib/site";

type DirectoryEntryCardProps = {
  entry: ContentEntry;
};

function compactCount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return String(value);
}

function getPreviewLine(entry: ContentEntry) {
  const firstCodeBlock = entry.codeBlocks?.[0]?.code?.split("\n")?.[0]?.trim();

  if (firstCodeBlock) return firstCodeBlock.slice(0, 96);
  if (entry.documentationUrl) return "Open docs for instructions";
  if (entry.downloadUrl) return "Download the package";
  if (entry.githubUrl) return "Open source file on GitHub";
  return "Open this entry on HeyClaude";
}

function getCopyText(entry: ContentEntry) {
  const firstCodeBlock = entry.codeBlocks?.[0]?.code?.trim();
  if (firstCodeBlock) return firstCodeBlock;
  if (entry.documentationUrl) return entry.documentationUrl;
  if (entry.githubUrl) return entry.githubUrl;
  return `${entry.title}\nhttps://heyclau.de/${entry.category}/${entry.slug}`;
}

export function DirectoryEntryCard({ entry }: DirectoryEntryCardProps) {
  const storageKey = `heyclaude-vote:${entry.category}:${entry.slug}`;
  const [hasVoted, setHasVoted] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseVotes = entry.popularityScore ?? entry.viewCount ?? 0;
  const displayedVotes = useMemo(() => baseVotes + (hasVoted ? 1 : 0), [baseVotes, hasVoted]);
  const previewLine = useMemo(() => getPreviewLine(entry), [entry]);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    setHasVoted(stored === "1");
  }, [storageKey]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleVote = () => {
    const nextValue = !hasVoted;
    setHasVoted(nextValue);
    window.localStorage.setItem(storageKey, nextValue ? "1" : "0");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getCopyText(entry));
    setCopied(true);
  };

  return (
    <article className="directory-stack-card">
      <div className="directory-vote-rail">
        <button
          type="button"
          aria-pressed={hasVoted}
          aria-label={hasVoted ? "Remove upvote" : "Upvote entry"}
          onClick={handleVote}
          className={cn("vote-button", hasVoted && "vote-button-active")}
        >
          <ChevronUp className="size-4" />
        </button>
        <div className="text-center">
          <div className="text-[18px] font-medium tracking-tight text-foreground">
            {compactCount(displayedVotes)}
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-4">
            <div className="directory-icon-tile">
              {(categoryLabels[entry.category] ?? entry.category).slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em]",
                    categoryAccentClasses[entry.category]
                  )}
                >
                  {categoryLabels[entry.category] ?? entry.category}
                </span>
                {entry.author ? (
                  <span className="text-sm text-muted-foreground">
                    by {entry.author}
                    {entry.dateAdded ? ` · ${entry.dateAdded}` : ""}
                  </span>
                ) : null}
              </div>

              <div className="space-y-2">
                <Link
                  href={`/${entry.category}/${entry.slug}`}
                  className="block text-[1.75rem] font-semibold tracking-tight text-foreground transition hover:text-primary"
                >
                  {entry.title}
                </Link>
                <p className="max-w-3xl text-[15px] leading-7 text-muted-foreground">
                  {entry.description}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-1.5 text-sm text-muted-foreground md:flex">
            <Github className="size-4" />
            <span>{compactCount(entry.viewCount ?? entry.popularityScore ?? 0)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="directory-code-bar">
            <span className="truncate text-[13px] text-primary">{previewLine}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-9 rounded-lg border-border bg-background px-3 text-xs"
          >
            <Copy className="mr-1.5 size-3.5" />
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {entry.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="directory-tag">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {entry.documentationUrl ? (
              <a
                href={entry.documentationUrl}
                target="_blank"
                rel="noreferrer"
                className="directory-link-chip"
              >
                Docs
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
            {entry.githubUrl ? (
              <a
                href={entry.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="directory-link-chip"
              >
                GitHub
                <Github className="size-3.5" />
              </a>
            ) : null}
            <Link href={`/${entry.category}/${entry.slug}`} className="directory-link-chip">
              Open
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
