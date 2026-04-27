import type { DirectoryEntry } from "@/lib/content";

export function safeSitemapDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function isSitemapIndexableEntry(entry: DirectoryEntry) {
  return entry.category !== "tools" && entry.robotsIndex !== false;
}

export function sitemapEntryLastModified(entry: DirectoryEntry) {
  return safeSitemapDate(
    entry.contentUpdatedAt ||
      entry.repoUpdatedAt ||
      entry.verifiedAt ||
      entry.dateAdded,
  );
}
