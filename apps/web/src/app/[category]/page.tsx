import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentCard } from "@/components/content-card";
import { getCategorySummaries, getEntriesByCategory } from "@/lib/content";
import { categoryLabels, siteConfig } from "@/lib/site";

type CategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export async function generateStaticParams() {
  return siteConfig.categoryOrder.map((category) => ({ category }));
}

export async function generateMetadata({
  params
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const label = categoryLabels[category] ?? category;

  return {
    title: label,
    description: `Browse ${label.toLowerCase()} on HeyClaude.`
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const [entries, summaries] = await Promise.all([
    getEntriesByCategory(category),
    getCategorySummaries()
  ]);

  if (!entries.length) {
    notFound();
  }

  const summary = summaries.find((item) => item.category === category);

  return (
    <div className="container space-y-10 py-12">
      <div className="space-y-4">
        <span className="eyebrow">{summary?.count ?? entries.length} entries</span>
        <h1 className="section-title">{categoryLabels[category] ?? category}</h1>
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
          {summary?.description}
        </p>
      </div>
      <div className="panel rounded-[1.75rem] p-5 text-sm leading-7 text-[var(--muted)]">
        Browse the full collection, compare entries side by side, and open the
        ones you want to save, use, or share.
      </div>
      <div className="border-b border-[var(--line)]">
        {entries.map((entry) => (
          <ContentCard key={`${entry.category}-${entry.slug}`} entry={entry} />
        ))}
      </div>
    </div>
  );
}
