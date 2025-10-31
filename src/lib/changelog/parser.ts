/**
 * Changelog Parser - Database-First Architecture
 * Parses CHANGELOG.md following Keep a Changelog 1.0.0 specification.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { logger } from '@/src/lib/logger';
import type { Json, Tables } from '@/src/types/database.types';

type ChangelogChanges = {
  Added: string[];
  Changed: string[];
  Deprecated: string[];
  Removed: string[];
  Fixed: string[];
  Security: string[];
};

export function generateSlug(date: string, title: string): string {
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);

  return `${date}-${titleSlug}`;
}

function extractTLDR(content: string): string | undefined {
  const tldrMatch = content.match(/\*\*TL;DR:\*\*\s*(.+?)(?:\n\n|###|$)/s);
  if (tldrMatch?.[1]) {
    return tldrMatch[1].trim();
  }
  return undefined;
}

function parseCategorySection(sectionContent: string): string[] {
  const items: string[] = [];
  const lines = sectionContent.split('\n');
  let currentItem = '';

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('-')) {
      if (currentItem.trim()) {
        items.push(currentItem.trim());
      }
      currentItem = trimmedLine.slice(1).trim();
    } else if (trimmedLine && currentItem) {
      currentItem += `\n${trimmedLine}`;
    }
  }

  if (currentItem.trim()) {
    items.push(currentItem.trim());
  }

  return items;
}

function extractCategories(content: string): ChangelogChanges {
  const sections: ChangelogChanges = {
    Added: [],
    Changed: [],
    Deprecated: [],
    Removed: [],
    Fixed: [],
    Security: [],
  };

  const categoryRegex =
    /###\s+(Added|Changed|Deprecated|Removed|Fixed|Security)\s*\n([\s\S]*?)(?=\n###|\n---|\n##|$)/gi;

  let match: RegExpExecArray | null;
  categoryRegex.lastIndex = 0;
  match = categoryRegex.exec(content);
  while (match !== null) {
    const categoryName = match[1] as keyof ChangelogChanges;
    const sectionContent = match[2]?.trim() || '';

    if (sectionContent) {
      const items = parseCategorySection(sectionContent);
      sections[categoryName] = items;
    }

    match = categoryRegex.exec(content);
  }

  return sections;
}

function parseEntry(
  entryContent: string,
  date: string,
  title: string
): Tables<'changelog_entries'> {
  const slug = generateSlug(date, title);
  const tldr = extractTLDR(entryContent);
  const changes = extractCategories(entryContent);

  const entry: Tables<'changelog_entries'> = {
    id: '',
    title,
    slug,
    release_date: date,
    tldr: tldr || null,
    content: entryContent,
    raw_content: entryContent,
    description: tldr || null,
    keywords: null,
    changes: changes as unknown as Json,
    published: true,
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    og_image: null,
    canonical_url: null,
    og_type: null,
    twitter_card: null,
    robots_index: null,
    robots_follow: null,
    json_ld: null,
  };

  return entry;
}

export async function parseChangelog(
  changelogPath: string = path.join(process.cwd(), 'CHANGELOG.md')
) {
  try {
    const fileContent = await fs.readFile(changelogPath, 'utf-8');

    const entryHeaderRegex = /^##\s+(\d{4}-\d{2}-\d{2})\s+-\s+(.+?)$/gm;

    const entries: Tables<'changelog_entries'>[] = [];
    const headerMatches: Array<{ index: number; date: string; title: string }> = [];

    let match: RegExpExecArray | null;
    entryHeaderRegex.lastIndex = 0;
    match = entryHeaderRegex.exec(fileContent);
    while (match !== null) {
      headerMatches.push({
        index: match.index,
        date: match[1] || '',
        title: match[2]?.trim() || '',
      });
      match = entryHeaderRegex.exec(fileContent);
    }

    for (let i = 0; i < headerMatches.length; i++) {
      const currentHeader = headerMatches[i];
      if (!currentHeader) continue;

      const nextHeader = headerMatches[i + 1];

      const entryStart = currentHeader.index;
      const entryEnd = nextHeader ? nextHeader.index : fileContent.length;
      const entryContent = fileContent.slice(entryStart, entryEnd).trim();

      try {
        const entry = parseEntry(entryContent, currentHeader.date, currentHeader.title);
        entries.push(entry);
      } catch (error) {
        logger.warn('Failed to parse changelog entry', {
          date: currentHeader.date,
          title: currentHeader.title,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    entries.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());

    const totalEntries = entries.length;
    const latestEntry = entries[0];
    const earliestEntry = entries[entries.length - 1];

    const dateRange =
      earliestEntry && latestEntry
        ? {
            earliest: earliestEntry.release_date,
            latest: latestEntry.release_date,
          }
        : undefined;

    const categoryCounts = {
      Added: 0,
      Changed: 0,
      Deprecated: 0,
      Removed: 0,
      Fixed: 0,
      Security: 0,
    };

    for (const entry of entries) {
      const changes = entry.changes as unknown as ChangelogChanges;
      if (Array.isArray(changes?.Added) && changes.Added.length > 0) categoryCounts.Added++;
      if (Array.isArray(changes?.Changed) && changes.Changed.length > 0) categoryCounts.Changed++;
      if (Array.isArray(changes?.Deprecated) && changes.Deprecated.length > 0)
        categoryCounts.Deprecated++;
      if (Array.isArray(changes?.Removed) && changes.Removed.length > 0) categoryCounts.Removed++;
      if (Array.isArray(changes?.Fixed) && changes.Fixed.length > 0) categoryCounts.Fixed++;
      if (Array.isArray(changes?.Security) && changes.Security.length > 0)
        categoryCounts.Security++;
    }

    const metadata = {
      totalEntries,
      ...(latestEntry && { latestEntry }),
      ...(dateRange && { dateRange }),
      categoryCounts,
    };

    return { entries, metadata };
  } catch (error) {
    logger.error(
      'Failed to parse CHANGELOG.md',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error(
      `Failed to parse CHANGELOG.md: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getChangelogEntryBySlug(
  slug: string
): Promise<Tables<'changelog_entries'> | undefined> {
  const changelog = await parseChangelog();
  return changelog.entries.find((entry) => entry.slug === slug);
}

export async function getAllChangelogEntries(): Promise<Tables<'changelog_entries'>[]> {
  const changelog = await parseChangelog();
  return changelog.entries;
}
