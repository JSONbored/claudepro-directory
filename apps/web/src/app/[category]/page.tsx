import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BrowseDirectory } from "@/components/browse-directory";
import { getDirectoryEntriesByCategory } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo";
import {
  categoryDescriptions,
  categoryLabels,
  categoryQuickstarts,
  categoryUsageHints
} from "@/lib/site";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const label = categoryLabels[category];
  const description = categoryDescriptions[category];

  if (!label || !description) {
    return buildPageMetadata({
      title: "Category not found",
      description: "The requested category could not be found.",
      path: `/${category}`,
      robots: { index: false, follow: false }
    });
  }

  return buildPageMetadata({
    title: `${label} directory`,
    description,
    path: `/${category}`,
    keywords: [label.toLowerCase(), "claude", "directory", "heyclaude"]
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const directoryEntries = await getDirectoryEntriesByCategory(category);
  const quickstart = categoryQuickstarts[category] ?? [];

  if (!directoryEntries.length) notFound();

  return (
    <div className="container-shell space-y-8 py-12">
      <div className="space-y-5 border-b border-border/80 pb-8">
        <span className="eyebrow">{categoryLabels[category] ?? category}</span>
        <h1 className="section-title">{categoryLabels[category] ?? category}</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          {categoryDescriptions[category]}
        </p>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
          <div className="rounded-2xl border border-border bg-card/80 px-4 py-4 text-sm leading-7 text-muted-foreground">
            {categoryUsageHints[category] ?? "Browse the best entries in this category."}
          </div>
          <div className="rounded-2xl border border-border bg-card/80 px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Entries
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {directoryEntries.length}
            </p>
          </div>
        </div>
        {quickstart.length ? (
          <div className="surface-panel p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Quickstart
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {quickstart.map((step, index) => (
                <div
                  key={step}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 text-muted-foreground"
                >
                  <span className="mb-2 inline-flex size-6 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-[11px] font-medium text-primary">
                    {index + 1}
                  </span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <BrowseDirectory entries={directoryEntries} />
    </div>
  );
}
