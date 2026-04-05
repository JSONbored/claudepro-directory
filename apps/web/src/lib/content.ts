import "server-only";

import { cache } from "react";
import contentIndex from "@/generated/content-index.json";

import { categoryLabels, siteConfig } from "@/lib/site";

export type ContentEntry = {
  category: string;
  slug: string;
  title: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  author?: string;
  authorProfileUrl?: string;
  dateAdded?: string;
  tags: string[];
  keywords: string[];
  readingTime?: number;
  popularityScore?: number;
  viewCount?: number;
  copyCount?: number;
  documentationUrl?: string;
  downloadUrl?: string;
  body: string;
  html: string;
  filePath: string;
  githubUrl: string;
  headings: Array<{
    depth: number;
    text: string;
    id: string;
  }>;
  codeBlocks: Array<{
    language: string;
    code: string;
  }>;
  primaryCodeBlock?: {
    language: string;
    code: string;
  } | null;
  isMetadataOnly: boolean;
};

export type CategorySummary = {
  category: string;
  label: string;
  count: number;
  description: string;
};

const categoryDescriptions: Record<string, string> = {
  agents: "Specialized Claude personas and autonomous workflows.",
  collections: "Curated bundles that group related Claude assets.",
  commands: "Slash commands and promptable actions for specific tasks.",
  guides: "Long-form tutorials and practical deep dives.",
  hooks: "Automation hooks for Claude Code and related workflows.",
  mcp: "Model Context Protocol servers and integrations.",
  rules: "Reusable guardrails, coding standards, and operating constraints.",
  skills: "Packaged Claude skills and implementation accelerators.",
  statuslines: "Statusline scripts and workflow telemetry helpers."
};

export const getAllEntries = cache(async () => {
  return (contentIndex as ContentEntry[])
    .filter((entry) => entry.category && entry.slug && entry.title)
    .sort((left, right) => {
      const popularity =
        (right.popularityScore ?? 0) - (left.popularityScore ?? 0);
      if (popularity !== 0) {
        return popularity;
      }
      return left.title.localeCompare(right.title);
    });
});

export const getEntriesByCategory = cache(async (category: string) => {
  const entries = await getAllEntries();
  return entries.filter((entry) => entry.category === category);
});

export const getEntry = cache(async (category: string, slug: string) => {
  const entries = await getAllEntries();
  return (
    entries.find(
      (entry) => entry.category === category && entry.slug === slug
    ) ?? null
  );
});

export const getFeaturedEntries = cache(async () => {
  const entries = await getAllEntries();
  return entries.slice(0, 8);
});

export const getRecentEntries = cache(async () => {
  const entries = await getAllEntries();
  return [...entries]
    .filter((entry) => entry.dateAdded)
    .sort((left, right) =>
      String(right.dateAdded).localeCompare(String(left.dateAdded))
    )
    .slice(0, 10);
});

export const getCategorySummaries = cache(async (): Promise<CategorySummary[]> => {
  const entries = await getAllEntries();

  return siteConfig.categoryOrder
    .map((category) => {
      const count = entries.filter((entry) => entry.category === category).length;
      return {
        category,
        label: categoryLabels[category] ?? category,
        count,
        description: categoryDescriptions[category] ?? ""
      };
    })
    .filter((summary) => summary.count > 0);
});
