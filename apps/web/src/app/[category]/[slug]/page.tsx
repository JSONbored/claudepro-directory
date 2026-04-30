import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  FolderTree,
  MessageSquare,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Tag,
  UserRound,
} from "lucide-react";

import { BrandAsset } from "@/components/brand-asset";
import { ContentSections } from "@/components/content-sections";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DetailToc } from "@/components/detail-toc";
import { EntryCopyButton } from "@/components/entry-copy-button";
import { EntryChecklistCard } from "@/components/entry-checklist-card";
import { GitHubMark } from "@/components/icons/github-mark";
import { JsonLd } from "@/components/json-ld";
import { SnippetCard } from "@/components/snippet-card";
import { getDirectoryEntries, getEntry } from "@/lib/content";
import {
  getCollectionItems,
  getDownloadHref,
  getMetadataFallback,
  getPrimarySnippet,
  getRelatedEntries,
  getSourceSignals,
  getTopFacts,
  htmlToPlainText,
  renderMarkdown,
  stripCodeBlocks,
} from "@/lib/detail-assembly";
import { getDistributionBadges } from "@heyclaude/registry/presentation";
import { buildPageMetadata } from "@/lib/seo";
import { categoryLabels, siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildEntryJsonLd,
  buildWebPageJsonLd,
} from "@heyclaude/registry/seo";

type DetailPageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export const dynamic = "force-dynamic";

function getGitHubEditUrl(githubUrl?: string) {
  if (!githubUrl) return "";
  try {
    const parsed = new URL(githubUrl);
    if (parsed.hostname !== "github.com") return githubUrl;
    const blobPathIndex = parsed.pathname.indexOf("/blob/");
    if (blobPathIndex >= 0) {
      const pathAfterBlob = parsed.pathname.slice(
        blobPathIndex + "/blob/".length,
      );
      parsed.pathname = `${parsed.pathname.slice(0, blobPathIndex)}/edit/${pathAfterBlob}`;
    }
    return parsed.toString();
  } catch {
    return githubUrl;
  }
}

function isHttpUrl(value: string) {
  const lowerValue = value.toLowerCase();
  return lowerValue.startsWith("https://") || lowerValue.startsWith("http://");
}

function displayUrlWithoutProtocol(value: string) {
  const lowerValue = value.toLowerCase();
  if (lowerValue.startsWith("https://")) return value.slice("https://".length);
  if (lowerValue.startsWith("http://")) return value.slice("http://".length);
  return value;
}

function getSuggestChangeUrl(entry: {
  category: string;
  slug: string;
  title: string;
  brandName?: string;
  brandDomain?: string;
}) {
  const url = new URL(`${siteConfig.githubUrl}/issues/new`);
  url.searchParams.set("title", `Suggest change: ${entry.title}`);
  url.searchParams.set(
    "body",
    [
      "### Entry",
      `${siteConfig.url}/${entry.category}/${entry.slug}`,
      "",
      "### Suggested change",
      "",
      "### Source or context",
      "",
      entry.brandName || entry.brandDomain
        ? [
            "### Brand metadata",
            entry.brandName ? `Brand: ${entry.brandName}` : "",
            entry.brandDomain ? `Domain: ${entry.brandDomain}` : "",
            "",
          ]
            .filter(Boolean)
            .join("\n")
        : "",
    ].join("\n"),
  );
  url.searchParams.set("labels", "needs-review,content-update");
  return url.toString();
}

function getEntryMonogram(entry: { category: string; title: string }) {
  const label = categoryLabels[entry.category] ?? entry.title;
  return label
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const entry = await getEntry(category, slug);

  if (!entry) {
    return buildPageMetadata({
      title: "Entry not found",
      description: "The requested directory entry could not be found.",
      path: `/${category}/${slug}`,
      robots: { index: false, follow: false },
    });
  }

  const title = entry.seoTitle ?? entry.title;
  const description = entry.seoDescription ?? entry.description;
  const keywords = [
    ...(entry.keywords ?? []),
    ...(entry.tags ?? []),
    entry.category,
  ];

  return buildPageMetadata({
    title,
    description,
    path: `/${entry.category}/${entry.slug}`,
    keywords,
    imageLabel: entry.category,
    imageKind: entry.category === "tools" ? "tool" : "entry",
    imageBadge: entry.platformCompatibility?.[0]?.platform ?? entry.category,
    robots:
      entry.robotsIndex !== undefined || entry.robotsFollow !== undefined
        ? {
            index: entry.robotsIndex ?? true,
            follow: entry.robotsFollow ?? true,
          }
        : undefined,
  });
}

export default async function DetailPage({ params }: DetailPageProps) {
  const { category, slug } = await params;
  const entry = await getEntry(category, slug);

  if (!entry) notFound();

  const allEntries = await getDirectoryEntries();
  const related = getRelatedEntries(entry, allEntries);
  const collectionItems = getCollectionItems(entry, allEntries);
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
    primaryCodeBlock?.code,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim());
  const renderedSections = await Promise.all(
    sectionItems.map(async (section) => ({
      ...section,
      html: await renderMarkdown(section.markdown),
      proseHtml: await renderMarkdown(stripCodeBlocks(section.markdown)),
    })),
  );
  const visibleSections = renderedSections.filter((section) => {
    const hasProse = htmlToPlainText(section.proseHtml).length > 0;
    const hasCode = section.codeBlocks.some(
      (block) => !omittedCode.includes(block.code.trim()),
    );

    return hasProse || hasCode;
  });
  const sidebarSections = visibleSections;
  const topFacts = getTopFacts(entry);
  const githubStars = Number(
    "githubStars" in entry && typeof entry.githubStars === "number"
      ? entry.githubStars
      : 0,
  );
  const referenceHref =
    entry.documentationUrl ?? entry.repoUrl ?? entry.githubUrl ?? "";
  const editHref = getGitHubEditUrl(entry.githubUrl);
  const suggestChangeHref = getSuggestChangeUrl(entry);
  const referenceLabel = entry.documentationUrl
    ? "Open docs"
    : entry.repoUrl
      ? "Open repository"
      : "Open source";
  const prerequisites = Array.isArray(entry.prerequisites)
    ? entry.prerequisites
    : [];
  const installationOrder = Array.isArray(entry.installationOrder)
    ? entry.installationOrder
    : [];
  const distributionBadges = getDistributionBadges(entry);
  const qualityBadges = [
    entry.repoUrl || entry.documentationUrl ? "External source" : "",
    entry.downloadTrust === "first-party" ? "Verified package" : "",
    entry.installCommand || entry.downloadUrl ? "Install path" : "",
    entry.configSnippet || entry.scriptBody || primarySnippet
      ? "Copy-ready"
      : "",
    entry.author ? "Attributed" : "First-party editorial",
  ].filter(Boolean);
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      {
        name: categoryLabels[entry.category] ?? entry.category,
        url: `${siteConfig.url}/${entry.category}`,
      },
      {
        name: entry.title,
        url: `${siteConfig.url}/${entry.category}/${entry.slug}`,
      },
    ]),
    buildWebPageJsonLd({
      siteUrl: siteConfig.url,
      path: `/${entry.category}/${entry.slug}`,
      name: entry.title,
      description: entry.seoDescription || entry.description,
      breadcrumbId: `${siteConfig.url}/${entry.category}/${entry.slug}#breadcrumb`,
    }),
    buildEntryJsonLd(entry, {
      siteUrl: siteConfig.url,
      siteName: siteConfig.name,
    }),
  ];
  const sourceSignals = getSourceSignals(entry);
  const renderedBody = await renderMarkdown(entry.body || "");

  return (
    <div className="container-shell grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_300px]">
      <JsonLd data={jsonLd} />
      <article className="space-y-8">
        <div className="space-y-4">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              {
                label: categoryLabels[entry.category] ?? entry.category,
                href: `/${entry.category}`,
              },
              { label: entry.title },
            ]}
          />
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Link href={`/${entry.category}`}>
              {categoryLabels[entry.category] ?? entry.category}
            </Link>
            {entry.dateAdded ? <span>{entry.dateAdded}</span> : null}
          </div>
          <div className="flex items-start gap-4">
            <BrandAsset
              entry={entry}
              fallback={getEntryMonogram(entry)}
              size="lg"
              className="mt-1"
            />
            <div className="min-w-0">
              {entry.brandName ? (
                <p className="text-sm font-medium text-primary">
                  {entry.brandName}
                  {entry.brandDomain ? (
                    <span className="text-muted-foreground">
                      {" "}
                      / {entry.brandDomain}
                    </span>
                  ) : null}
                </p>
              ) : null}
              <h1 className="section-title">{entry.title}</h1>
              <p className="mt-3 max-w-3xl text-base leading-8 text-muted-foreground">
                {entry.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {distributionBadges.map((badge) => (
              <span
                key={badge.label}
                className="distribution-badge"
                title={badge.title}
              >
                {badge.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {qualityBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-border bg-card/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              >
                {badge}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 lg:hidden">
            {editHref ? (
              <a
                href={editHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:border-primary/40"
              >
                <PencilLine className="size-4" />
                Edit on GitHub
              </a>
            ) : null}
            <a
              href={suggestChangeHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:border-primary/40"
            >
              <MessageSquare className="size-4" />
              Suggest change
            </a>
          </div>
          {topFacts.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {topFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-2xl border border-border/80 bg-card/80 px-4 py-3"
                >
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
            language={
              primarySnippetBlock.language ||
              primaryCodeBlock?.language ||
              "text"
            }
          />
        ) : null}

        {entry.configSnippet ? (
          <SnippetCard
            eyebrow="Claude config"
            title={
              entry.category === "statuslines"
                ? "Statusline config"
                : ".claude/settings.json"
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
              This entry does not include long-form body content yet, so the
              source file and docs links in the sidebar are the current source
              of truth.
            </p>
            {metadataFallback?.points?.length ? (
              <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                {metadataFallback.points.map((point) => (
                  <li
                    key={point}
                    className="rounded-xl border border-border bg-background px-4 py-3"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : entry.scriptBody ||
          (primaryCodeBlock &&
            entry.codeBlocks.length === 1 &&
            !entry.headings.length) ? null : (
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
            items={installationOrder.map(
              (item, index) => `${index + 1}. ${item}`,
            )}
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
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              On this page
            </p>
            <div className="mt-3">
              <DetailToc sections={sidebarSections} />
            </div>
          </div>
        ) : null}

        <div className="surface-panel p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Entry overview
          </p>
          <div className="mt-3 space-y-3 text-sm">
            <div className="space-y-2">
              <EntryCopyButton
                entry={entry}
                label="Copy full asset"
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-foreground transition hover:border-primary/40"
              />
              {entry.installCommand ? (
                <EntryCopyButton
                  text={entry.installCommand}
                  label="Copy install"
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                />
              ) : null}
              {entry.configSnippet ? (
                <EntryCopyButton
                  text={entry.configSnippet}
                  label="Copy config"
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                />
              ) : null}
              {referenceHref ? (
                <a
                  href={referenceHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  {entry.documentationUrl ? (
                    <BookOpen className="size-4" />
                  ) : (
                    <ExternalLink className="size-4" />
                  )}
                  {referenceLabel}
                </a>
              ) : null}
              {entry.githubUrl && entry.githubUrl !== referenceHref ? (
                <a
                  href={entry.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  <GitHubMark className="size-4" />
                  Open source
                </a>
              ) : null}
              {editHref ? (
                <a
                  href={editHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  <PencilLine className="size-4" />
                  Edit on GitHub
                </a>
              ) : null}
              <a
                href={suggestChangeHref}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <MessageSquare className="size-4" />
                Suggest change
              </a>
              <Link
                href="/claim"
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                Claim/update listing
              </Link>
              <a
                href={`/api/registry/entries/${entry.category}/${entry.slug}`}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                API detail
              </a>
              <a
                href={`/api/registry/entries/${entry.category}/${entry.slug}/llms`}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                LLM text
              </a>
            </div>

            {entry.downloadUrl ? (
              <div className="space-y-2">
                <a
                  href={getDownloadHref(entry.downloadUrl)}
                  download={
                    entry.downloadUrl.startsWith("/downloads/") ? "" : undefined
                  }
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
                      Review source code and permissions before running
                      downloadable files.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-muted-foreground">
              <div className="space-y-1.5">
                {entry.brandName || entry.brandDomain ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Provider
                    </span>
                    <span className="flex min-w-0 items-center gap-2 text-foreground">
                      <BrandAsset
                        entry={entry}
                        fallback={getEntryMonogram(entry)}
                        size="sm"
                        className="size-6 rounded-md text-[9px]"
                      />
                      <span className="truncate">
                        {entry.brandName || entry.brandDomain}
                      </span>
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Author
                  </span>
                  <span className="flex min-w-0 items-center gap-2 text-foreground">
                    <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {entry.author ?? "JSONbored"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Category
                  </span>
                  <span className="flex min-w-0 items-center gap-2 text-foreground">
                    <FolderTree className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {categoryLabels[entry.category] ?? entry.category}
                    </span>
                  </span>
                </div>
                {entry.dateAdded ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Added
                    </span>
                    <span className="flex min-w-0 items-center gap-2 text-foreground">
                      <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{entry.dateAdded}</span>
                    </span>
                  </div>
                ) : null}
                {entry.argumentHint ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Arguments
                    </span>
                    <span className="flex min-w-0 items-center gap-2 text-foreground">
                      <Tag className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{entry.argumentHint}</span>
                    </span>
                  </div>
                ) : null}
                {entry.trigger ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Trigger
                    </span>
                    <span className="flex min-w-0 items-center gap-2 text-foreground">
                      <Sparkles className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{entry.trigger}</span>
                    </span>
                  </div>
                ) : null}
                {entry.category === "skills" && entry.skillType ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Skill type
                    </span>
                    <span className="truncate text-foreground">
                      {entry.skillType}
                    </span>
                  </div>
                ) : null}
                {entry.category === "skills" && entry.skillLevel ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Skill level
                    </span>
                    <span className="truncate text-foreground">
                      {entry.skillLevel}
                    </span>
                  </div>
                ) : null}
                {entry.category === "skills" && entry.verificationStatus ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Verification
                    </span>
                    <span className="truncate text-foreground">
                      {entry.verificationStatus}
                    </span>
                  </div>
                ) : null}
                {entry.verifiedAt ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Verified
                    </span>
                    <span className="truncate text-foreground">
                      {entry.verifiedAt}
                    </span>
                  </div>
                ) : null}
                {entry.contentUpdatedAt ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Updated
                    </span>
                    <span className="truncate text-foreground">
                      {entry.contentUpdatedAt.slice(0, 10)}
                    </span>
                  </div>
                ) : null}
                {githubStars > 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Stars
                    </span>
                    <span className="truncate text-foreground">
                      {githubStars.toLocaleString()}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {entry.category === "skills" && entry.platformCompatibility?.length ? (
          <div className="surface-panel p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Platforms
            </p>
            <div className="mt-3 space-y-2.5">
              {entry.platformCompatibility.map((item) => (
                <div
                  key={`${item.platform}:${item.supportLevel}`}
                  className="rounded-xl border border-border bg-background px-3 py-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">
                      {item.platform}
                    </p>
                    <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {item.supportLevel}
                    </span>
                  </div>
                  <code className="mt-2 block break-all rounded-lg border border-border/80 bg-card/80 p-2 text-[10px] text-muted-foreground">
                    {item.installPath}
                  </code>
                  {item.adapterPath ? (
                    <a
                      href={item.adapterPath}
                      className="mt-2 inline-flex text-xs font-medium text-primary underline underline-offset-4"
                    >
                      Open adapter
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {sourceSignals.length || entry.brandDomain ? (
          <div className="surface-panel p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Trust & source
            </p>
            <div className="mt-3 space-y-2.5">
              {entry.brandDomain ? (
                <div className="rounded-xl border border-border bg-background px-3 py-3 text-sm">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Brand asset
                  </p>
                  <p className="mt-1 text-foreground">
                    {entry.brandAssetSource === "brandfetch"
                      ? "Brand icon via Brandfetch"
                      : entry.brandAssetSource || "Brand metadata"}
                  </p>
                </div>
              ) : null}
              {sourceSignals.map((signal) => {
                const isUrl = isHttpUrl(signal.value);
                return (
                  <div
                    key={signal.label}
                    className="rounded-xl border border-border bg-background px-3 py-3 text-sm"
                  >
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {signal.label}
                    </p>
                    {isUrl ? (
                      <a
                        href={signal.value}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block truncate text-foreground transition hover:text-primary"
                      >
                        {displayUrlWithoutProtocol(signal.value)}
                      </a>
                    ) : (
                      <p className="mt-1 text-foreground">{signal.value}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="surface-panel p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Related
          </p>
          <div className="mt-3 space-y-2.5">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/${item.category}/${item.slug}`}
                className="detail-related-card"
              >
                <div className="flex items-start gap-2">
                  <BrandAsset
                    entry={item}
                    fallback={getEntryMonogram(item)}
                    size="sm"
                    className="size-7 rounded-md text-[9px]"
                  />
                  <div className="min-w-0">
                    <span className="detail-related-badge">
                      {categoryLabels[item.category] ?? item.category}
                    </span>
                    <p className="detail-related-title mt-2 text-sm font-medium tracking-tight">
                      {item.title}
                    </p>
                  </div>
                </div>
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
