import "server-only";

import { cache } from "react";

import contentIndex from "@/generated/content-index.json";
import { categoryDescriptions, categoryLabels, siteConfig } from "@/lib/site";

export type ContentEntry = (typeof contentIndex)[number];

export type CategorySummary = {
  category: string;
  label: string;
  count: number;
  description: string;
};

export const getAllEntries = cache(async (): Promise<ContentEntry[]> => {
  return contentIndex as ContentEntry[];
});

export const getEntry = cache(async (category: string, slug: string) => {
  const entries = await getAllEntries();
  return entries.find((entry) => entry.category === category && entry.slug === slug) ?? null;
});

export const getEntriesByCategory = cache(async (category: string) => {
  const entries = await getAllEntries();
  return entries.filter((entry) => entry.category === category);
});

export const getCategorySummaries = cache(async (): Promise<CategorySummary[]> => {
  const entries = await getAllEntries();
  return siteConfig.categoryOrder
    .map((category) => {
      const count = entries.filter((entry) => entry.category === category).length;
      return {
        category,
        label: categoryLabels[category],
        count,
        description: categoryDescriptions[category]
      };
    })
    .filter((entry) => entry.count > 0);
});

export const getRecentEntries = cache(async () => {
  const entries = await getAllEntries();
  return [...entries]
    .filter((entry) => entry.dateAdded)
    .sort((left, right) => String(right.dateAdded).localeCompare(String(left.dateAdded)))
    .slice(0, 12);
});
