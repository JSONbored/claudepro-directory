import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  FolderTree,
  ShieldCheck,
  Sparkles,
  Tag,
  UserRound
} from "lucide-react";

import { ContentSections } from "@/components/content-sections";
import { DetailToc } from "@/components/detail-toc";
import { EntryCopyButton } from "@/components/entry-copy-button";
import { EntryChecklistCard } from "@/components/entry-checklist-card";
import { GitHubMark } from "@/components/icons/github-mark";
import { SnippetCard } from "@/components/snippet-card";
import { getDirectoryEntries, getEntry } from "@/lib/content";
import { categoryLabels } from "@/lib/site";

type DetailPageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const entry = await getEntry(category, slug);

  return {
    title: entry?.seoTitle ?? entry?.title,
    description: entry?.seoDescription ?? entry?.description
  };
}

function stripCodeBlocks(markdown: string) {
  return String(markdown || "")
    .replace(/```[\w-]*\n[\s\S]*?```/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function renderMarkdown(markdown: string) {
  const output = await marked.parse(markdown);
  return typeof output === "string" ? output : String(output);
}

function getPrimarySnippet(entry: NonNullable<Awaited<ReturnType<typeof getEntry>>>) {
  switch (entry.category) {
    case "agents":
    case "rules":
      return {
        title: "Copyable asset",
        code: entry.body || entry.copySnippet || entry.usageSnippet,
        language: "md"
      };
    case "hooks":
      if (entry.configSnippet) {
        return {
          title: "Claude config",
          code: entry.configSnippet,
          language: "json"
        };
      }
      return {
        title: entry.scriptBody ? "Hook script" : "Usage",
        code: entry.scriptBody || entry.copySnippet || entry.usageSnippet,
        language: entry.scriptLanguage || "text"
      };
    case "mcp":
    case "skills":
    case "commands":
      return {
        title: entry.installCommand
          ? "Install command"
          : entry.commandSyntax
            ? "Command syntax"
            : "Usage",
        code: entry.installCommand || entry.commandSyntax || entry.copySnippet || entry.usageSnippet,
        language: entry.scriptLanguage || "text"
      };
    case "statuslines":
      return {
        title: entry.configSnippet
          ? "Claude config"
          : entry.scriptBody
            ? "Source asset"
            : "Usage",
        code: entry.configSnippet || entry.scriptBody || entry.copySnippet || entry.usageSnippet,
        language: entry.configSnippet ? "json" : entry.scriptLanguage || "text"
      };
    case "collections":
      return {
        title: "Quick start",
        code: entry.usageSnippet || entry.copySnippet || entry.body,
        language: "text"
      };
    case "guides":
      return {
        title: "Quick summary",
        code: entry.usageSnippet || entry.copySnippet || entry.body,
        language: "text"
      };
    default:
      return {
        title: entry.copySnippet ? "Copyable asset" : "Usage",
        code: entry.copySnippet || entry.usageSnippet || entry.body,
        language: entry.scriptLanguage || "text"
      };
  }
}

function getMetadataFallback(entry: Awaited<ReturnType<typeof getEntry>>) {
  if (!entry) return null;

  if (entry.category === "hooks") {
    return {
      title: "How to use this hook",
      points: [
        entry.trigger
          ? `Register it under the \`${entry.trigger}\` hook event in your Claude Code configuration.`
          : "Register it in your Claude Code hooks configuration.",
        entry.documentationUrl
          ? "Use the documentation link in the sidebar to confirm the event shape and required config."
          : "Open the source file in GitHub to copy the exact implementation and adapt it to your project.",
        "Keep the source file in your repo and test it locally before relying on it in production workflows."
      ]
    };
  }

  if (entry.category === "collections") {
    return {
      title: "How to use this collection",
      points: [
        "Open the source file to review the assets included in the collection.",
        "Pick the individual entries you want to use and add them to your Claude workflow one by one.",
        "Collections need richer item metadata next, but the GitHub source still gives you the current canonical list."
      ]
    };
  }

  if (entry.documentationUrl || entry.repoUrl) {
    return {
      title: "How to use this entry",
      points: [
        entry.documentationUrl
          ? "Start with the documentation link in the sidebar for setup and usage details."
          : "Open the repository in the sidebar for setup details.",
        "Use the source link to inspect the exact file this directory entry was built from.",
        "Copy the relevant snippet or config into your local Claude setup and test it before wider use."
      ]
    };
  }

  return {
    title: "How to use this entry",
    points: [
      "Open the GitHub source file in the sidebar.",
      "Copy the content you need into your project or Claude configuration.",
      "Test it locally and adapt it to your workflow before relying on it."
    ]
  };
}

function getDownloadHref(downloadUrl: string) {
  if (downloadUrl.startsWith("/downloads/")) {
    return `/api/download?asset=${encodeURIComponent(downloadUrl)}`;
  }
  return downloadUrl;
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default async function DetailPage({ params }: DetailPageProps) {
  const { category, slug } = await params;
  const entry = await getEntry(category, slug);

  if (!entry) notFound();

  const allEntries = await getDirectoryEntries();
  const relatedPool = allEntries.filter((item) => item.slug !== slug);
  const entryTagSet = new Set((entry.tags ?? []).map((tag) => tag.toLowerCase()));
  const anchorHash = hashString(`${entry.category}:${entry.slug}`);
  const related = relatedPool
    .map((item) => {
      const sharedTagCount = (item.tags ?? []).reduce((count, tag) => {
        return entryTagSet.has(tag.toLowerCase()) ? count + 1 : count;
      }, 0);
      const sameCategory = item.category === entry.category ? 1 : 0;
      const hasDocs = item.documentationUrl ? 1 : 0;
      const hasInstall = item.installCommand ? 1 : 0;
      const dateScore = item.dateAdded ? new Date(item.dateAdded).getTime() : 0;
      const closeness = Math.abs(hashString(`${item.category}:${item.slug}`) - anchorHash);

      return {
        item,
        score: sharedTagCount * 8 + sameCategory * 3 + hasDocs + hasInstall,
        dateScore,
        closeness
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.dateScore !== left.dateScore) return right.dateScore - left.dateScore;
      return left.closeness - right.closeness;
    })
    .slice(0, 2)
    .map((entry) => entry.item);
  const collectionItems =
    entry.category === "collections" && Array.isArray(entry.items)
      ? entry.items
          .map((item) => ({
            ...item,
            target:
              allEntries.find(
                (candidate) =>
                  candidate.category === item.category && candidate.slug === item.slug
              ) ?? null
          }))
          .filter((item) => item.target)
      : [];
  const hasBody = Boolean(entry.body?.trim());
  const primaryCodeBlock = entry.codeBlocks?.[0];
  const metadataOnly = !hasBody;
  const sectionItems = Array.isArray(entry.sections) ? entry.sections : [];
  const metadataFallback = getMetadataFallback(entry);
  const primarySnippetBlock = getPrimarySnippet(entry);
  const primarySnippet = primarySnippetBlock.code?.trim();
  const snippetTitle = primarySnippet ? primarySnippetBlock.title : null;
  const omittedCode = [
    primarySnippet,
    entry.configSnippet,
    entry.scriptBody,
    primaryCodeBlock?.code
  ]
    .filter(Boolean)
    .map((value) => String(value).trim());
  const renderedSections = await Promise.all(
    sectionItems.map(async (section) => ({
      ...section,
      html: await renderMarkdown(section.markdown),
      proseHtml: await renderMarkdown(stripCodeBlocks(section.markdown))
    }))
  );
  const visibleSections = renderedSections.filter((section) => {
    const hasProse = section.proseHtml.replace(/<[^>]+>/g, "").trim().length > 0;
    const hasCode = section.codeBlocks.some(
      (block) => !omittedCode.includes(block.code.trim())
    );

    return hasProse || hasCode;
  });
  const sidebarSections = visibleSections;
  const topFacts: Array<{ label: string; value: string }> = [
    entry.author ? { label: "Author", value: entry.author } : null,
    entry.dateAdded ? { label: "Added", value: entry.dateAdded } : null,
    entry.trigger ? { label: "Trigger", value: entry.trigger } : null,
    entry.argumentHint ? { label: "Arguments", value: entry.argumentHint } : null,
    entry.scriptLanguage ? { label: "Format", value: entry.scriptLanguage } : null,
    entry.estimatedSetupTime ? { label: "Setup time", value: entry.estimatedSetupTime } : null,
    entry.difficulty ? { label: "Difficulty", value: entry.difficulty } : null
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));
  const githubStars = Number(
    "githubStars" in entry && typeof entry.githubStars === "number"
      ? entry.githubStars
      : 0
  );
  const prerequisites = Array.isArray(entry.prerequisites) ? entry.prerequisites : [];
  const installationOrder = Array.isArray(entry.installationOrder)
    ? entry.installationOrder
    : [];
  const renderedBody = await renderMarkdown(entry.body || "");

  return (
    <div className="container-shell grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_300px]">
      <article className="space-y-8">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Link href={`/${entry.category}`}>{categoryLabels[entry.category] ?? entry.category}</Link>
            {entry.dateAdded ? <span>{entry.dateAdded}</span> : null}
          </div>
          <h1 className="section-title">{entry.title}</h1>
          <p className="max-w-3xl text-base leading-8 text-muted-foreground">
            {entry.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
          {topFacts.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {topFacts.map((fact) => (
                <div key={fact.label} className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {fact.label}
                  </p>
                  <p className="mt-1 text-sm text-foreground">{fact.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {primarySnippet && snippetTitle ? (
          <SnippetCard
            eyebrow="Quick use"
            title={snippetTitle}
            code={primarySnippet}
            language={primarySnippetBlock.language || primaryCodeBlock?.language || "text"}
          />
        ) : null}

        {entry.configSnippet ? (
          <SnippetCard
            eyebrow="Claude config"
            title={
              entry.category === "statuslines" ? "Statusline config" : ".claude/settings.json"
            }
            code={entry.configSnippet}
            language="json"
          />
        ) : null}

        {entry.scriptBody ? (
          <SnippetCard
            eyebrow="Source asset"
            title={entry.scriptLanguage || "script"}
            code={entry.scriptBody}
            language={entry.scriptLanguage || "text"}
          />
        ) : primaryCodeBlock ? (
          <SnippetCard
            eyebrow="Source asset"
            title={primaryCodeBlock.language || "text"}
            code={primaryCodeBlock.code}
            language={primaryCodeBlock.language || "text"}
          />
        ) : null}

        {visibleSections.length ? (
          <ContentSections sections={visibleSections} omitCode={omittedCode} />
        ) : metadataOnly ? (
          <section className="surface-panel p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Metadata only
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
              {metadataFallback?.title ?? "How to use this entry"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              This entry does not include long-form body content yet, so the source file and docs links in the sidebar are the current source of truth.
            </p>
            {metadataFallback?.points?.length ? (
              <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                {metadataFallback.points.map((point) => (
                  <li key={point} className="rounded-xl border border-border bg-background px-4 py-3">
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : (entry.scriptBody || (primaryCodeBlock && entry.codeBlocks.length === 1 && !entry.headings.length)) ? null : (
          <div
            className="prose-entry"
            dangerouslySetInnerHTML={{ __html: renderedBody }}
          />
        )}

        {collectionItems.length ? (
          <section className="surface-panel p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Included items
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
              Explore this collection
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {collectionItems.map((item) => (
                <Link
                  key={`${item.category}:${item.slug}`}
                  href={`/${item.category}/${item.slug}`}
                  className="rounded-2xl border border-border bg-background px-4 py-3 transition hover:border-primary/70"
                >
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {categoryLabels[item.category] ?? item.category}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {item.target?.title}
                  </p>
                  {item.target?.cardDescription ? (
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      {item.target.cardDescription}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {installationOrder.length ? (
          <EntryChecklistCard
            entryKey={`${entry.category}:${entry.slug}`}
            eyebrow="Recommended order"
            title="Install and apply in this sequence"
            description="Work through the sequence in order and mark each step locally as you complete it."
            items={installationOrder.map((item, index) => `${index + 1}. ${item}`)}
          />
        ) : null}

        {prerequisites.length ? (
          <EntryChecklistCard
            entryKey={`${entry.category}:${entry.slug}`}
            eyebrow="Prerequisites"
            title="Before you use this entry"
            description="Work through the setup requirements first. Progress is stored locally in your browser so you can come back later."
            items={prerequisites}
          />
        ) : null}
      </article>

      <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block lg:self-start">
        {sidebarSections.length ? (
          <div className="rounded-2xl border border-border/70 bg-transparent p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">On this page</p>
            <div className="mt-3">
              <DetailToc sections={sidebarSections} />
            </div>
          </div>
        ) : null}

        <div className="surface-panel p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Entry overview</p>
          <div className="mt-3 space-y-3 text-sm">
            <div className="grid grid-cols-4 gap-2">
              <EntryCopyButton
                entry={entry}
                iconOnly
                title="Copy full asset"
                className="flex h-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:border-primary/40"
              />
              <a
                href={entry.githubUrl}
                target="_blank"
                rel="noreferrer"
                title="GitHub source"
                aria-label="GitHub source"
                className="flex h-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <GitHubMark className="size-4" />
              </a>
              <a
                href={entry.documentationUrl ?? entry.repoUrl ?? entry.githubUrl}
                target="_blank"
                rel="noreferrer"
                title={entry.documentationUrl ? "Documentation" : "Repository"}
                aria-label={entry.documentationUrl ? "Documentation" : "Repository"}
                className="flex h-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                {entry.documentationUrl ? <BookOpen className="size-4" /> : <ExternalLink className="size-4" />}
              </a>
            </div>

            {entry.downloadUrl ? (
              <div className="space-y-2">
                <a
                  href={getDownloadHref(entry.downloadUrl)}
                  download={entry.downloadUrl.startsWith("/downloads/") ? "" : undefined}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-primary/60 bg-primary px-3 py-2.5 text-primary-foreground shadow-sm transition hover:border-primary hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-2">
                    <Download className="size-4 text-primary-foreground" />
                    <span className="font-medium">Download package</span>
                  </span>
                  <span className="rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-primary-foreground/90">
                    {entry.category === "skills" ? "ZIP" : "MCPB"}
                  </span>
                </a>

                {entry.downloadTrust === "first-party" ? (
                  <div className="rounded-xl border border-primary/35 bg-card/85 p-3 text-xs text-foreground">
                    <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
                      <CheckCircle2 className="size-3.5" />
                      <ShieldCheck className="size-3.5" />
                      <span>Verified package</span>
                    </p>
                    {entry.downloadSha256 ? (
                      <div className="mt-2 rounded-lg border border-border/80 bg-background/90 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          SHA256
                          </p>
                          <EntryCopyButton
                            text={entry.downloadSha256}
                            label="Copy SHA256"
                            iconOnly
                            title="Copy SHA256"
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-foreground transition hover:border-primary/40"
                          />
                        </div>
                        <code className="mt-1 block break-all font-mono text-[10px] text-foreground/95">
                          {entry.downloadSha256}
                        </code>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs leading-6 text-foreground">
                    <p className="flex items-center gap-2 font-medium text-destructive">
                      <AlertTriangle className="size-3.5" />
                      <span>External package (unverified)</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Review source code and permissions before running downloadable files.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-muted-foreground">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Author</span>
                  <span className="flex min-w-0 items-center gap-2 text-foreground">
                    <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{entry.author ?? "JSONbored"}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Category</span>
                  <span className="flex min-w-0 items-center gap-2 text-foreground">
                    <FolderTree className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{categoryLabels[entry.category] ?? entry.category}</span>
                  </span>
                </div>
                {entry.dateAdded ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Added</span>
                    <span className="flex min-w-0 items-center gap-2 text-foreground">
                      <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{entry.dateAdded}</span>
                    </span>
                  </div>
                ) : null}
                {entry.argumentHint ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Arguments</span>
                    <span className="flex min-w-0 items-center gap-2 text-foreground">
                      <Tag className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{entry.argumentHint}</span>
                    </span>
                  </div>
                ) : null}
                {entry.trigger ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Trigger</span>
                    <span className="flex min-w-0 items-center gap-2 text-foreground">
                      <Sparkles className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{entry.trigger}</span>
                    </span>
                  </div>
                ) : null}
                {githubStars > 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Stars</span>
                    <span className="truncate text-foreground">{githubStars.toLocaleString()}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="surface-panel p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Related</p>
          <div className="mt-3 space-y-2.5">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/${item.category}/${item.slug}`}
                className="detail-related-card"
              >
                <span className="detail-related-badge">
                  {categoryLabels[item.category] ?? item.category}
                </span>
                <p className="detail-related-title mt-2 text-sm font-medium tracking-tight">
                  {item.title}
                </p>
                <p className="mt-1 overflow-hidden text-xs text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]">
                  {item.cardDescription || item.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
