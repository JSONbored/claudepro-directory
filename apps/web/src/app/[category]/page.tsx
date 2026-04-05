import { notFound } from "next/navigation";

import { BrowseDirectory } from "@/components/browse-directory";
import { getEntriesByCategory } from "@/lib/content";
import { categoryDescriptions, categoryLabels, siteConfig } from "@/lib/site";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  return siteConfig.categoryOrder.map((category) => ({ category }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const entries = await getEntriesByCategory(category);

  if (!entries.length) notFound();

  return (
    <div className="container-shell space-y-8 py-12">
      <div className="space-y-4 border-b border-border/80 pb-8">
        <span className="eyebrow">{categoryLabels[category] ?? category}</span>
        <h1 className="section-title">{categoryLabels[category] ?? category}</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          {categoryDescriptions[category]}
        </p>
      </div>
      <BrowseDirectory entries={entries} />
    </div>
  );
}
