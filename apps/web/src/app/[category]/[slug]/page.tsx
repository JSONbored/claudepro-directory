import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentSections } from "@/components/content-sections";
import { SnippetCard } from "@/components/snippet-card";
import { getAllEntries, getEntriesByCategory, getEntry } from "@/lib/content";
import { categoryLabels } from "@/lib/site";

type DetailPageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export async function generateStaticParams() {
  const entries = await getAllEntries();
  return entries.map((entry) => ({ category: entry.category, slug: entry.slug }));
}

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const entry = await getEntry(category, slug);

  return {
    title: entry?.seoTitle ?? entry?.title,
    description: entry?.seoDescription ?? entry?.description
  };
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

  const allEntries = await getAllEntries();
  const related = (await getEntriesByCategory(category))
    .filter((item) => item.slug !== slug)
    .slice(0, 4);
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
  const primarySnippet =
    entry.installCommand || entry.commandSyntax || entry.usageSnippet || entry.copySnippet;
  const snippetTitle = entry.installCommand
    ? "Install command"
    : entry.commandSyntax
      ? "Command syntax"
      : entry.usageSnippet
        ? "Usage"
        : entry.copySnippet
          ? "Copyable asset"
          : null;
  const omittedCode = [
    primarySnippet,
    entry.configSnippet,
    entry.scriptBody,
    primaryCodeBlock?.code
  ]
    .filter(Boolean)
    .map((value) => String(value).trim());
  const visibleSections = sectionItems.filter((section) => {
    const hasProse = section.proseHtml.replace(/<[^>]+>/g, "").trim().length > 0;
    const hasCode = section.codeBlocks.some(
      (block) => !omittedCode.includes(block.code.trim())
    );

    return hasProse || hasCode;
  });
  const topFacts: Array<{ label: string; value: string }> = [
    entry.author ? { label: "Author", value: entry.author } : null,
    entry.dateAdded ? { label: "Added", value: entry.dateAdded } : null,
    entry.trigger ? { label: "Trigger", value: entry.trigger } : null,
    entry.argumentHint ? { label: "Arguments", value: entry.argumentHint } : null,
    entry.scriptLanguage ? { label: "Format", value: entry.scriptLanguage } : null,
    entry.estimatedSetupTime ? { label: "Setup time", value: entry.estimatedSetupTime } : null,
    entry.difficulty ? { label: "Difficulty", value: entry.difficulty } : null
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

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
            language={entry.scriptLanguage || primaryCodeBlock?.language || "text"}
          />
        ) : null}

        {entry.configSnippet ? (
          <SnippetCard
            eyebrow="Claude config"
            title=".claude/settings.json"
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
            dangerouslySetInnerHTML={{ __html: entry.html }}
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
      </article>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Quick links</p>
          <div className="mt-4 space-y-3 text-sm">
            <a href={entry.githubUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-border bg-background px-4 py-3">
              GitHub source
            </a>
            {sourceLabel ? (
              <div className="rounded-xl border border-border bg-background px-4 py-3 text-muted-foreground">
                <p className="text-[11px] uppercase tracking-[0.16em]">Path</p>
                <p className="mt-1 break-all text-sm text-foreground">{sourceLabel}</p>
              </div>
            ) : null}
            {entry.documentationUrl ? (
              <a href={entry.documentationUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-border bg-background px-4 py-3">
                Documentation
              </a>
            ) : null}
            {entry.repoUrl ? (
              <a href={entry.repoUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-border bg-background px-4 py-3">
                Repository
              </a>
            ) : null}
            {entry.downloadUrl ? (
              <a href={entry.downloadUrl} className="block rounded-xl border border-border bg-background px-4 py-3">
                Download package
              </a>
            ) : null}
          </div>
        </div>

        <div className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Details</p>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em]">Author</p>
              <p className="mt-1 text-foreground">{entry.author ?? "JSONbored"}</p>
            </div>
            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em]">Category</p>
              <p className="mt-1 text-foreground">{categoryLabels[entry.category] ?? entry.category}</p>
            </div>
            {entry.dateAdded ? (
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em]">Added</p>
                <p className="mt-1 text-foreground">{entry.dateAdded}</p>
              </div>
            ) : null}
            {entry.argumentHint ? (
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em]">Arguments</p>
                <p className="mt-1 text-foreground">{entry.argumentHint}</p>
              </div>
            ) : null}
            {entry.trigger ? (
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em]">Hook trigger</p>
                <p className="mt-1 text-foreground">{entry.trigger}</p>
              </div>
            ) : null}
            {entry.githubStars ? (
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em]">GitHub stars</p>
                <p className="mt-1 text-foreground">{entry.githubStars.toLocaleString()}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Related</p>
          <div className="mt-4 space-y-4">
            {related.map((item) => (
              <Link key={item.slug} href={`/${item.category}/${item.slug}`} className="block">
                <p className="detail-related-title text-sm font-medium tracking-tight">{item.title}</p>
                <p className="detail-related-description mt-1 text-xs text-muted-foreground">
                  {item.cardDescription || item.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {visibleSections.length ? (
          <div className="surface-panel p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">On this page</p>
            <div className="mt-4 space-y-3">
              {visibleSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block text-sm text-muted-foreground transition hover:text-foreground"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
