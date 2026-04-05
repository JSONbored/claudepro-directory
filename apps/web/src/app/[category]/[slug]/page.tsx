import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Clock3,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileText,
  Layers3,
  Link2
} from "lucide-react";

import { getAllEntries, getEntriesByCategory, getEntry } from "@/lib/content";
import { categoryLabels, categoryUsageGuides } from "@/lib/site";

type DetailPageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const entries = await getAllEntries();
  return entries.map((entry) => ({
    category: entry.category,
    slug: entry.slug
  }));
}

export async function generateMetadata({
  params
}: DetailPageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const entry = await getEntry(category, slug);

  if (!entry) {
    return {};
  }

  return {
    title: entry.seoTitle ?? entry.title,
    description: entry.seoDescription ?? entry.description
  };
}

export default async function DetailPage({ params }: DetailPageProps) {
  const { category, slug } = await params;
  const entry = await getEntry(category, slug);

  if (!entry) {
    notFound();
  }

  const related = (await getEntriesByCategory(category))
    .filter((item) => item.slug !== slug)
    .slice(0, 4);
  const usageGuide = categoryUsageGuides[entry.category];
  const showPrimaryCode =
    !!entry.primaryCodeBlock &&
    entry.primaryCodeBlock.code.trim().length > 0;
  const showBody =
    !entry.isMetadataOnly &&
    !(entry.category === "statuslines" && showPrimaryCode);
  const showContentNote = entry.isMetadataOnly;

  const stats = [
    entry.readingTime
      ? { label: "Read time", value: `${entry.readingTime} min`, icon: Clock3 }
      : null,
    typeof entry.viewCount === "number"
      ? { label: "Views", value: String(entry.viewCount), icon: Eye }
      : null,
    typeof entry.copyCount === "number"
      ? { label: "Copies", value: String(entry.copyCount), icon: Copy }
      : null
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    icon: typeof Clock3;
  }>;

  return (
    <div className="container grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_340px]">
      <article className="space-y-8">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            <Link href={`/${entry.category}`}>
              {categoryLabels[entry.category] ?? entry.category}
            </Link>
            {entry.dateAdded ? <span>{entry.dateAdded}</span> : null}
            {entry.readingTime ? <span>{entry.readingTime} min read</span> : null}
          </div>
          <h1 className="section-title">{entry.title}</h1>
          <p className="max-w-3xl text-base leading-8 text-[var(--muted)]">
            {entry.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--line)] px-3 py-1 text-xs uppercase tracking-[0.1em] text-[var(--muted)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
          <section className="panel rounded-[1.75rem] p-6">
            <p className="text-sm uppercase tracking-[0.15em] text-[var(--muted)]">
              How to use
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
              {usageGuide?.title ?? "Use this entry"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              {usageGuide?.summary}
            </p>
            <ol className="mt-5 grid gap-3">
              {usageGuide?.steps.map((step, index) => (
                <li
                  key={step}
                  className="rounded-[1rem] border border-[var(--line)] bg-white/55 px-4 py-3 text-sm leading-7 text-[var(--muted)]"
                >
                  <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ink)] text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          {showPrimaryCode ? (
            <section className="panel rounded-[1.75rem] p-6">
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.15em] text-[var(--muted)]">
                <FileCode2 className="h-4 w-4" />
                Quick copy
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                {entry.category === "statuslines"
                  ? "Copy the script into a local file, make it executable, and point Claude Code at it."
                  : "A key snippet from this entry is surfaced here so it is easier to grab without digging through the full page."}
              </p>
              <pre className="asset-code mt-5 overflow-x-auto rounded-[1.25rem] bg-[#171512] p-4 text-sm text-[#f8f2e8]">
                <code>{entry.primaryCodeBlock?.code}</code>
              </pre>
            </section>
          ) : null}
        </div>

        {showBody ? (
          <div
            className="content-prose max-w-none"
            dangerouslySetInnerHTML={{ __html: entry.html }}
          />
        ) : showContentNote ? (
          <section className="panel rounded-[1.75rem] p-6">
            <p className="text-sm uppercase tracking-[0.15em] text-[var(--muted)]">
              Content note
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              {usageGuide?.emptyState}
            </p>
          </section>
        ) : null}
      </article>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className="panel rounded-[1.5rem] p-5">
          <p className="text-sm uppercase tracking-[0.15em] text-[var(--muted)]">
            At a glance
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-[1rem] border border-[var(--line)] bg-white/50 p-3"
                >
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-[var(--muted)]">
                    <Icon className="h-3.5 w-3.5" />
                    {stat.label}
                  </div>
                  <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel rounded-[1.5rem] p-5">
          <p className="text-sm uppercase tracking-[0.15em] text-[var(--muted)]">
            Source & links
          </p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
            {entry.author ? (
              <p>
                Author:{" "}
                {entry.authorProfileUrl ? (
                  <a
                    href={entry.authorProfileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4"
                  >
                    {entry.author}
                  </a>
                ) : (
                  <span className="text-[var(--ink)]">{entry.author}</span>
                )}
              </p>
            ) : null}
            <a
              href={entry.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-[1rem] border border-[var(--line)] bg-white/50 px-4 py-3 text-[var(--ink)]"
            >
              <span>{usageGuide?.sourceLabel ?? "GitHub source"}</span>
              <Link2 className="h-4 w-4" />
            </a>
            {entry.documentationUrl ? (
              <a
                href={entry.documentationUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-[1rem] border border-[var(--line)] bg-white/50 px-4 py-3 text-[var(--ink)]"
              >
                <span>Open documentation</span>
                <FileText className="h-4 w-4" />
              </a>
            ) : null}
            {entry.downloadUrl ? (
              <a
                href={entry.downloadUrl}
                className="flex items-center justify-between rounded-[1rem] border border-[var(--line)] bg-white/50 px-4 py-3 text-[var(--ink)]"
              >
                <span>Download package</span>
                <Download className="h-4 w-4" />
              </a>
            ) : null}
            <Link
              href={`/${entry.category}`}
              className="flex items-center justify-between rounded-[1rem] border border-[var(--line)] bg-white/50 px-4 py-3 text-[var(--ink)]"
            >
              <span>More {categoryLabels[entry.category] ?? entry.category}</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {entry.headings.length ? (
          <div className="panel rounded-[1.5rem] p-5">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.15em] text-[var(--muted)]">
              <Layers3 className="h-4 w-4" />
              On this page
            </div>
            <div className="mt-4 space-y-2">
              {entry.headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className="flex items-start gap-2 rounded-[1rem] border border-transparent px-3 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--line)] hover:bg-white/45 hover:text-[var(--ink)]"
                >
                  <Link2 className="mt-1 h-3.5 w-3.5 shrink-0" />
                  <span className={heading.depth > 2 ? "pl-4" : ""}>{heading.text}</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="panel rounded-[1.5rem] p-5">
          <p className="text-sm uppercase tracking-[0.15em] text-[var(--muted)]">
            Related
          </p>
          <div className="mt-4 space-y-4">
            {related.map((item) => (
              <Link key={item.slug} href={`/${item.category}/${item.slug}`} className="block">
                <p className="text-sm text-[var(--muted)]">{item.category}</p>
                <p className="font-medium tracking-[-0.02em]">{item.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
