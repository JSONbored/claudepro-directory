'use client';

import type { DisplayableContent } from '@heyclaude/web-runtime/types/component.types';

function parseDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

export function getItemPublishedDate(item: DisplayableContent): Date | null {
  const candidates: unknown[] = [];

  if ('date_added' in item) candidates.push(item.date_added);
  if ('published_at' in item) candidates.push(item.published_at);
  if ('created_at' in item) candidates.push(item.created_at);
  if ('updated_at' in item) candidates.push(item.updated_at);

  for (const candidate of candidates) {
    const parsed = parseDate(candidate);
    if (parsed) return parsed;
  }

  return null;
}

export function isNewSince(item: DisplayableContent, cutoff: Date | null): boolean {
  if (!cutoff) return false;
  const publishedAt = getItemPublishedDate(item);
  return Boolean(publishedAt && publishedAt.getTime() >= cutoff.getTime());
}

function getTrendingScore(item: DisplayableContent): number {
  const views = 'view_count' in item && typeof item.view_count === 'number' ? item.view_count : 0;
  const copies = 'copy_count' in item && typeof item.copy_count === 'number' ? item.copy_count : 0;
  const rating =
    'rating_count' in item && typeof item.rating_count === 'number' ? item.rating_count : 0;

  return views * 0.5 + copies * 0.35 + rating * 0.15;
}

export function getTrendingSlugs(items: readonly DisplayableContent[], topN = 3): Set<string> {
  // Defensive check: ensure items is not null/undefined before accessing .length
  if (!items?.length || topN <= 0) {
    return new Set();
  }

  const scored = items
    .map((item) => ({
      slug: typeof item.slug === 'string' ? item.slug : null,
      score: getTrendingScore(item),
    }))
    .filter((entry) => entry.slug && entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return new Set(scored.map((entry) => entry.slug as string));
}
