import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  FileCode2,
  FolderTree,
  Link as LinkIcon,
  ShieldCheck,
  Sparkles,
  Tag,
  UserRound
} from "lucide-react";

import { ContentSections } from "@/components/content-sections";
import { DetailToc } from "@/components/detail-toc";
import { EntryCopyButton } from "@/components/entry-copy-button";
import { EntryChecklistCard } from "@/components/entry-checklist-card";
import { SnippetCard } from "@/components/snippet-card";
import { getDirectoryEntries, getDirectoryEntriesByCategory, getEntry } from "@/lib/content";
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

export default async function DetailPage({ params }: DetailPageProps) {
  const { category, slug } = await params;
  const entry = await getEntry(category, slug);

  if (!entry) notFound();

  const allEntries = await getDirectoryEntries();
  const related = (await getDirectoryEntriesByCategory(category))
    .filter((item) => item.slug !== slug)
    .slice(0, 3);
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
  const sourceLabel = entry.filePath?.replace(/^content\//, "");
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
  const sidebarSections = visibleSections.slice(0, 8);
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

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        {sidebarSections.length ? (
          <div className="rounded-2xl border border-border/70 bg-transparent p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">On this page</p>
            <div className="mt-3">
              <DetailToc sections={sidebarSections} />
              {visibleSections.length > sidebarSections.length ? (
                <p className="pt-2 text-xs text-muted-foreground">
                  {visibleSections.length - sidebarSections.length} more sections in content
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Entry overview</p>
          <div className="mt-4 space-y-3 text-sm">
            <EntryCopyButton
              entry={entry}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition hover:border-primary/40"
            />
            {entry.installCommand ? (
              <EntryCopyButton
                text={entry.installCommand}
                label="Copy install command"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition hover:border-primary/40"
              />
            ) : null}
            {entry.configSnippet ? (
              <EntryCopyButton
                text={entry.configSnippet}
                label="Copy Claude config"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition hover:border-primary/40"
              />
            ) : null}
            <a
              href={entry.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/40"
            >
              <FileCode2 className="size-4 text-muted-foreground" />
              <span>GitHub source</span>
            </a>
            {entry.documentationUrl ? (
              <a
                href={entry.documentationUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/40"
              >
                <BookOpen className="size-4 text-muted-foreground" />
                <span>Documentation</span>
              </a>
            ) : null}
            {entry.repoUrl ? (
              <a
                href={entry.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/40"
              >
                <FileCode2 className="size-4 text-muted-foreground" />
                <span>Repository</span>
              </a>
            ) : null}
            {entry.downloadUrl ? (
              <div className="space-y-2">
                <a
                  href={entry.downloadUrl}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/40"
                >
                  <LinkIcon className="size-4 text-muted-foreground" />
                  <span>Download package</span>
                </a>

                {entry.downloadTrust === "first-party" ? (
                  <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-xs leading-6 text-emerald-100">
                    <p className="flex items-center gap-2 font-medium text-emerald-200">
                      <ShieldCheck className="size-3.5" />
                      <span>Maintainer-verified package</span>
                    </p>
                    {entry.downloadSha256 ? (
                      <p className="mt-1 break-all text-[11px] text-emerald-100/90">
                        SHA256: {entry.downloadSha256}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs leading-6 text-amber-100">
                    <p className="flex items-center gap-2 font-medium text-amber-200">
                      <AlertTriangle className="size-3.5" />
                      <span>External package (unverified)</span>
                    </p>
                    <p className="mt-1 text-[11px] text-amber-100/90">
                      Review source code and permissions before running downloadable files.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="grid gap-3 pt-1 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em]">Author</p>
                <p className="mt-1 flex items-center gap-2 text-foreground">
                  <UserRound className="size-3.5 text-muted-foreground" />
                  <span>{entry.author ?? "JSONbored"}</span>
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em]">Category</p>
                <p className="mt-1 flex items-center gap-2 text-foreground">
                  <FolderTree className="size-3.5 text-muted-foreground" />
                  <span>{categoryLabels[entry.category] ?? entry.category}</span>
                </p>
              </div>
              {entry.dateAdded ? (
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em]">Added</p>
                  <p className="mt-1 flex items-center gap-2 text-foreground">
                    <CalendarDays className="size-3.5 text-muted-foreground" />
                    <span>{entry.dateAdded}</span>
                  </p>
                </div>
              ) : null}
              {entry.argumentHint ? (
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em]">Arguments</p>
                  <p className="mt-1 flex items-center gap-2 text-foreground">
                    <Tag className="size-3.5 text-muted-foreground" />
                    <span>{entry.argumentHint}</span>
                  </p>
                </div>
              ) : null}
              {entry.trigger ? (
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em]">Hook trigger</p>
                  <p className="mt-1 flex items-center gap-2 text-foreground">
                    <Sparkles className="size-3.5 text-muted-foreground" />
                    <span>{entry.trigger}</span>
                  </p>
                </div>
              ) : null}
              {githubStars > 0 ? (
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em]">GitHub stars</p>
                  <p className="mt-1 text-foreground">{githubStars.toLocaleString()}</p>
                </div>
              ) : null}
            </div>

            {sourceLabel ? (
              <div className="rounded-xl border border-border bg-background px-4 py-3 text-muted-foreground">
                <p className="text-[11px] uppercase tracking-[0.16em]">Path</p>
                <p className="mt-1 break-all text-sm text-foreground">{sourceLabel}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Related</p>
          <div className="mt-4 space-y-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/${item.category}/${item.slug}`}
                className="detail-related-card"
              >
                <span className="detail-related-badge">
                  {categoryLabels[item.category] ?? item.category}
                </span>
                <p className="detail-related-title mt-2 text-sm font-medium tracking-tight">{item.title}</p>
                <p className="detail-related-description mt-1 text-xs text-muted-foreground">
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
