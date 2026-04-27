import "server-only";

import { cache } from "react";

import { getDirectoryEntries, type DirectoryEntry } from "@/lib/content";

export type ContributorSummary = {
  slug: string;
  name: string;
  profileUrl?: string;
  entryCount: number;
  entries: DirectoryEntry[];
};

export function contributorSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const getContributors = cache(async () => {
  const entries = await getDirectoryEntries();
  const grouped = new Map<string, ContributorSummary>();

  for (const entry of entries) {
    const name = String(entry.author || "JSONbored").trim();
    if (!name) continue;
    const slug = contributorSlug(name);
    if (!slug) continue;
    const existing = grouped.get(slug) ?? {
      slug,
      name,
      profileUrl: entry.authorProfileUrl,
      entryCount: 0,
      entries: [],
    };
    existing.entries.push(entry);
    existing.entryCount = existing.entries.length;
    existing.profileUrl ||= entry.authorProfileUrl;
    grouped.set(slug, existing);
  }

  return [...grouped.values()].sort(
    (left, right) =>
      right.entryCount - left.entryCount || left.name.localeCompare(right.name),
  );
});

export const getContributor = cache(async (slug: string) => {
  const contributors = await getContributors();
  return contributors.find((contributor) => contributor.slug === slug) ?? null;
});
