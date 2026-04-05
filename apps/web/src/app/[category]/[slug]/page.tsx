import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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

export default async function DetailPage({ params }: DetailPageProps) {
  const { category, slug } = await params;
  const entry = await getEntry(category, slug);

  if (!entry) notFound();

  const related = (await getEntriesByCategory(category))
    .filter((item) => item.slug !== slug)
    .slice(0, 4);

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
        </div>

        <div
          className="prose-entry"
          dangerouslySetInnerHTML={{ __html: entry.html }}
        />
      </article>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Quick links</p>
          <div className="mt-4 space-y-3 text-sm">
            <a href={entry.githubUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-border bg-background px-4 py-3">
              GitHub source
            </a>
            {entry.documentationUrl ? (
              <a href={entry.documentationUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-border bg-background px-4 py-3">
                Documentation
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
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Related</p>
          <div className="mt-4 space-y-4">
            {related.map((item) => (
              <Link key={item.slug} href={`/${item.category}/${item.slug}`} className="block">
                <p className="text-sm font-medium tracking-tight">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
