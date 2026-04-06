"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, ChevronUp, Copy, FileCode2, FileText, Github } from "lucide-react";

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

function firstUsefulLine(value?: string | null) {
  if (!value) return "";

  const candidates = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("```"))
    .filter((line) => !line.startsWith("#"))
    .filter((line) => !line.startsWith("//"))
    .filter((line) => !line.startsWith("/*"))
    .filter((line) => !line.startsWith("*"))
    .filter((line) => !line.startsWith("<!--"));

  return candidates[0] ?? "";
}

function getPreviewLine(entry: ContentEntry) {
  if (entry.installCommand) return entry.installCommand.slice(0, 96);
  if (entry.commandSyntax) return entry.commandSyntax.slice(0, 96);
  if (entry.usageSnippet) {
    const line = firstUsefulLine(entry.usageSnippet) || entry.usageSnippet;
    return line.slice(0, 96);
  }
  if (entry.category === "hooks" && entry.trigger) {
    return `Claude Code hook: ${entry.trigger}`;
  }
  if (entry.copySnippet) {
    const line = firstUsefulLine(entry.copySnippet);
    if (line) return line.slice(0, 96);
  }
  if (entry.category === "agents" || entry.category === "rules") {
    return "Copy the prompt and use it in Claude Code";
  }
  if (entry.category === "hooks" && !entry.scriptBody) {
    return "Open source file for hook details";
  }
  const firstCodeBlock = entry.codeBlocks?.[0]?.code?.split("\n")?.[0]?.trim();

  if (firstCodeBlock) return firstCodeBlock.slice(0, 96);
  if (entry.documentationUrl) return "See docs for setup";
  if (entry.downloadUrl) return "Download the package";
  if (entry.githubUrl) return "See GitHub for instructions";
  return "Open this entry on HeyClaude";
}

function appendLabeledBlock(lines: string[], label: string, value?: string | null) {
  const normalized = String(value || "").trim();
  if (!normalized) return;
  if (lines.length) lines.push("");
  lines.push(`${label}:`);
  lines.push(normalized);
}

function getCopyText(entry: ContentEntry) {
  const body = String(entry.body || "").trim();

  if (entry.category === "agents" || entry.category === "rules") {
    return body || entry.copySnippet || entry.usageSnippet || entry.description;
  }

  if (entry.category === "hooks") {
    const lines: string[] = [];
    appendLabeledBlock(lines, "Trigger", entry.trigger);
    appendLabeledBlock(lines, "Install", entry.installCommand);
    appendLabeledBlock(lines, "Claude config", entry.configSnippet);
    appendLabeledBlock(lines, "Hook script", entry.scriptBody || entry.copySnippet);
    if (body) appendLabeledBlock(lines, "Reference", body);
    return lines.join("\n");
  }

  if (entry.category === "mcp") {
    const lines: string[] = [];
    appendLabeledBlock(lines, "Install", entry.installCommand || entry.commandSyntax);
    appendLabeledBlock(lines, "Config", entry.configSnippet);
    appendLabeledBlock(lines, "Usage", entry.copySnippet || entry.usageSnippet || body);
    return lines.join("\n") || entry.documentationUrl || entry.repoUrl || entry.title;
  }

  if (entry.category === "skills" || entry.category === "statuslines") {
    const lines: string[] = [];
    appendLabeledBlock(lines, "Install", entry.installCommand);
    appendLabeledBlock(lines, "Usage", entry.usageSnippet);
    appendLabeledBlock(lines, "Asset", entry.scriptBody || entry.copySnippet || body);
    return lines.join("\n");
  }

  if (entry.category === "commands") {
    return entry.commandSyntax || entry.copySnippet || entry.usageSnippet || body;
  }

  if (entry.category === "collections" || entry.category === "guides") {
    return body || entry.copySnippet || entry.usageSnippet || entry.description;
  }

  if (entry.copySnippet) return entry.copySnippet;
  if (entry.installCommand) return entry.installCommand;
  if (entry.usageSnippet) return entry.usageSnippet;
  const firstCodeBlock = entry.codeBlocks?.[0]?.code?.trim();
  if (firstCodeBlock) return firstCodeBlock;
  if (body) return body;
  if (entry.documentationUrl) return entry.documentationUrl;
  if (entry.githubUrl) return entry.githubUrl;
  return `${entry.title}\nhttps://heyclau.de/${entry.category}/${entry.slug}`;
}

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

export function DirectoryEntryCard({ entry }: DirectoryEntryCardProps) {
  const storageKey = `heyclaude-vote:${entry.category}:${entry.slug}`;
  const [hasVoted, setHasVoted] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseVotes = entry.popularityScore ?? entry.viewCount ?? 0;
  const displayedVotes = useMemo(() => baseVotes + (hasVoted ? 1 : 0), [baseVotes, hasVoted]);
  const previewLine = useMemo(() => getPreviewLine(entry), [entry]);
  const cardDescription = useMemo(() => getCardDescription(entry), [entry]);
  const repoHref = entry.repoUrl || entry.githubUrl;
  const relativeDate = useMemo(() => formatRelativeDate(entry.dateAdded), [entry.dateAdded]);

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

          {repoHref ? (
            <a
              href={repoHref}
              target="_blank"
              rel="noreferrer"
              className="directory-github-stat"
              aria-label="Open repository on GitHub"
            >
              <Github className="size-4" />
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
            className="h-8 rounded-lg border-border bg-background px-3 text-[11px]"
          >
            <Copy className="mr-1.5 size-3.5" />
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
                <Github className="size-3.5" />
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
