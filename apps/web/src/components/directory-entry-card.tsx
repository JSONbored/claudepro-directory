"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, ChevronUp, Copy, FileCode2, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import type { ContentEntry } from "@/lib/content";
import { compactCount, getCopyText, getPreviewLine } from "@/lib/entry-presentation";
import { cn } from "@/lib";
import { categoryAccentClasses, categoryLabels } from "@/lib/site";

type DirectoryEntryCardProps = {
  entry: ContentEntry;
  voteCount?: number;
  hasVoted?: boolean;
  onToggleVote?: (
    entry: ContentEntry,
    nextVote: boolean
  ) => Promise<{ count: number; voted: boolean }>;
};

function getCardDescription(entry: ContentEntry) {
  const normalized = (entry.cardDescription || entry.description).replace(/\s+/g, " ").trim();
  if (normalized.length <= 220) return normalized;

  const sentence = normalized.match(/^(.{0,220}[.!?])\s/);
  if (sentence?.[1]) return sentence[1];

  return `${normalized.slice(0, 217).trimEnd()}...`;
}

function formatRelativeDate(date?: string) {
  if (!date) return null;
  const published = new Date(date);
  if (Number.isNaN(published.getTime())) return date;

  const diffDays = Math.max(
    1,
    Math.round((Date.now() - published.getTime()) / (1000 * 60 * 60 * 24))
  );

  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.round(diffDays / 30)}mo ago`;
  return `${Math.round(diffDays / 365)}y ago`;
}

function getMonogram(entry: ContentEntry) {
  const label = categoryLabels[entry.category] ?? entry.category;
  return label
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DirectoryEntryCard({
  entry,
  voteCount,
  hasVoted: hasVotedProp = false,
  onToggleVote
}: DirectoryEntryCardProps) {
  const baseVotes = 0;
  const [hasVoted, setHasVoted] = useState(hasVotedProp);
  const [displayedVotes, setDisplayedVotes] = useState(voteCount ?? baseVotes);
  const [isVoting, setIsVoting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { pushToast } = useToast();

  const previewLine = useMemo(() => getPreviewLine(entry), [entry]);
  const cardDescription = useMemo(() => getCardDescription(entry), [entry]);
  const repoHref = entry.repoUrl || entry.githubUrl;
  const relativeDate = useMemo(() => formatRelativeDate(entry.dateAdded), [entry.dateAdded]);

  useEffect(() => {
    setHasVoted(hasVotedProp);
  }, [hasVotedProp]);

  useEffect(() => {
    setDisplayedVotes(voteCount ?? baseVotes);
  }, [baseVotes, voteCount]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleVote = async () => {
    if (isVoting) return;
    const nextValue = !hasVoted;
    const previousValue = hasVoted;
    const previousCount = displayedVotes;
    const optimisticCount = Math.max(0, previousCount + (nextValue ? 1 : -1));

    setIsVoting(true);
    setHasVoted(nextValue);

    if (!onToggleVote) {
      setDisplayedVotes(optimisticCount);
      setIsVoting(false);
      return;
    }

    setDisplayedVotes(optimisticCount);

    try {
      const persisted = await onToggleVote(entry, nextValue);
      setHasVoted(persisted.voted);
      setDisplayedVotes(persisted.count);
    } catch {
      setHasVoted(previousValue);
      setDisplayedVotes(previousCount);
    } finally {
      setIsVoting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCopyText(entry));
      setCopied(true);
      window.dispatchEvent(new CustomEvent("heyclaude:intent", { detail: { type: "copy" } }));
      pushToast({
        variant: "success",
        title: "Copied to clipboard",
        description: entry.title
      });
    } catch {
      pushToast({
        variant: "error",
        title: "Copy failed",
        description: "Clipboard access was blocked by the browser."
      });
    }
  };

  return (
    <article className="directory-stack-card group">
      <div className={cn("directory-vote-rail", hasVoted && "directory-vote-rail-active")}>
        <div
          className={cn(
            "directory-vote-tile text-[11px] font-medium uppercase tracking-[0.18em]",
            hasVoted && "directory-vote-tile-active",
            categoryAccentClasses[entry.category]
          )}
        >
          {getMonogram(entry)}
        </div>
        <button
          type="button"
          aria-pressed={hasVoted}
          aria-label={hasVoted ? "Remove upvote" : "Upvote entry"}
          onClick={handleVote}
          disabled={isVoting}
          className={cn("vote-button", hasVoted && "vote-button-active")}
        >
          <ChevronUp className="size-4" />
        </button>
        <div className="text-center">
          <div
            className={cn(
              "text-[18px] font-medium tracking-tight text-foreground transition",
              hasVoted && "text-primary"
            )}
          >
            {compactCount(displayedVotes)}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/${entry.category}/${entry.slug}`}
                className="directory-title block font-semibold tracking-tight text-foreground transition group-hover:text-primary"
              >
                {entry.title}
              </Link>
              <Check className="size-4 shrink-0 text-primary/90" />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                  categoryAccentClasses[entry.category]
                )}
              >
                {categoryLabels[entry.category] ?? entry.category}
              </span>
              {entry.author ? <span>by {entry.author}</span> : null}
              {relativeDate ? <span>· {relativeDate}</span> : null}
            </div>
          </div>

          {repoHref && typeof entry.githubStars === "number" && entry.githubStars > 0 ? (
            <a
              href={repoHref}
              target="_blank"
              rel="noreferrer"
              className="directory-github-stat"
              aria-label="Open repository on GitHub"
            >
              <FileCode2 className="size-4" />
              {typeof entry.githubStars === "number" ? (
                <span>{compactCount(entry.githubStars)}</span>
              ) : null}
            </a>
          ) : null}
        </div>

        <p className="directory-description max-w-3xl text-[13px] leading-6 text-muted-foreground">
          {cardDescription}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="directory-code-bar">
            <span className="directory-code-text text-[13px] text-primary">{previewLine}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className={cn(
              "h-8 rounded-lg border-border bg-background px-3 text-[11px]",
              copied &&
                "border-emerald-500/45 bg-[color-mix(in_oklab,var(--background)_88%,oklch(0.85_0.08_154)_12%)] text-emerald-600 dark:text-emerald-300"
            )}
          >
            {copied ? (
              <Check className="copy-check-icon mr-1.5 size-3.5 text-emerald-500" />
            ) : (
              <Copy className="mr-1.5 size-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
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
                className="directory-icon-chip"
                aria-label="Open documentation"
                title="Open documentation"
              >
                <FileText className="size-3.5" />
              </a>
            ) : null}
            {repoHref ? (
              <a
                href={repoHref}
                target="_blank"
                rel="noreferrer"
                className="directory-icon-chip"
                aria-label="Open repository"
                title="Open repository"
              >
                <FileCode2 className="size-3.5" />
              </a>
            ) : null}
            {entry.githubUrl && entry.githubUrl !== repoHref ? (
              <a
                href={entry.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="directory-icon-chip"
                aria-label="Open source content file"
                title="Open source content file"
              >
                <FileCode2 className="size-3.5" />
              </a>
            ) : null}
            <Link href={`/${entry.category}/${entry.slug}`} className="directory-link-chip">
              <ArrowUpRight className="size-3.5" />
              Open
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
