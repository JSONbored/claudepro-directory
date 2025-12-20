/**
 * Content Transformation Utilities
 *
 * Shared utilities for transforming database results to displayable content items.
 * Eliminates duplicate transformation logic across multiple components and pages.
 */

import { type content_category } from '@prisma/client';
import {
  type GetPopularContentReturns,
  type GetTrendingMetricsWithContentReturns,
} from '@heyclaude/database-types/postgres-types';
import { type GetRecentContentReturns } from '@heyclaude/data-layer';
import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';
import {
  type DisplayableContent,
  type HomepageContentItem,
} from '@heyclaude/web-runtime/types/component.types';

/**
 * Normalizes a raw content record into a HomepageContentItem suitable for display.
 *
 * Optional properties are normalized with sensible defaults:
 * - `title` defaults to `slug`
 * - `description` defaults to empty string
 * - `author` defaults to `"Community"`
 * - `tags` defaults to `[]`
 * - `source` defaults to `"community"`
 * - `created_at`/`date_added` default to current ISO timestamp when both are missing
 * - `viewCount`/`copyCount` default to `0`
 * - `featured` flag is set when `featuredScore` is provided
 *
 * @param input - Raw content fields with optional properties
 * @returns The normalized HomepageContentItem with canonical field names and defaults applied
 */
export function toHomepageContentItem(input: {
  author?: null | string;
  category: content_category;
  copyCount?: null | number;
  created_at?: null | string;
  date_added?: null | string;
  description?: null | string;
  featuredRank?: null | number;
  featuredScore?: null | number;
  slug: string;
  source?: null | string;
  tags?: null | string[];
  title?: null | string;
  viewCount?: null | number;
}): HomepageContentItem {
  // Use static fallback timestamp instead of new Date() (build-time safe)
  // If both created_at and date_added are missing, use epoch timestamp
  const timestamp = input.created_at ?? input.date_added ?? '1970-01-01T00:00:00.000Z';

  return {
    author: input.author ?? 'Community',
    category: input.category,
    copy_count: input.copyCount ?? 0,
    created_at: input.created_at ?? timestamp,
    date_added: input.date_added ?? timestamp,
    description: input.description ?? '',
    featured: input.featuredScore != null && typeof input.featuredScore === 'number',
    slug: input.slug,
    source: input.source ?? 'community',
    tags: Array.isArray(input.tags) ? input.tags : [],
    title: input.title ?? input.slug,
    view_count: input.viewCount ?? 0,
  };
}

/**
 * Maps trending metrics data to displayable content items.
 *
 * @param rows - Array of trending metrics with content data
 * @param category - Optional category filter (null for all categories)
 * @returns Array of displayable content items
 */
export function mapTrendingMetrics(
  rows: GetTrendingMetricsWithContentReturns,
  category: content_category | null,
  defaultCategory: content_category = 'agents'
): DisplayableContent[] {
  if (rows.length === 0) return [];
  return rows.map((row: GetTrendingMetricsWithContentReturns[number], index: number) => {
    const resolvedCategory = category ?? row.category;
    const validCategory = isValidCategory(resolvedCategory)
      ? (resolvedCategory as content_category)
      : defaultCategory;
    return toHomepageContentItem({
      author: row.author ?? 'Community',
      category: validCategory,
      copyCount: row.copies_total ?? 0,
      description: row.description ?? '',
      featuredRank: index + 1,
      featuredScore: row.trending_score ?? null,
      slug: row.slug ?? '',
      source: row.source ?? null,
      tags: row.tags ?? [],
      title: row.title ?? null,
      viewCount: row.views_total ?? 0,
    });
  });
}

/**
 * Maps popular content data to displayable content items.
 *
 * @param rows - Array of popular content data
 * @param category - Optional category filter (null for all categories)
 * @returns Array of displayable content items
 */
export function mapPopularContent(
  rows: GetPopularContentReturns,
  category: content_category | null,
  defaultCategory: content_category = 'agents'
): DisplayableContent[] {
  if (rows.length === 0) return [];
  return rows.map((row: GetPopularContentReturns[number], index: number) => {
    const resolvedCategory = category ?? row.category;
    const validCategory = isValidCategory(resolvedCategory)
      ? (resolvedCategory as content_category)
      : defaultCategory;
    return toHomepageContentItem({
      author: row.author ?? 'Community',
      category: validCategory,
      copyCount: row.copy_count ?? 0,
      description: row.description ?? '',
      featuredRank: index + 1,
      featuredScore: row.popularity_score ?? null,
      slug: row.slug ?? '',
      tags: row.tags ?? [],
      title: row.title ?? null,
      viewCount: row.view_count ?? 0,
    });
  });
}

/**
 * Maps recent content data to displayable content items.
 *
 * @param rows - Array of recent content data
 * @param category - Optional category filter (null for all categories)
 * @returns Array of displayable content items
 */
export function mapRecentContent(
  rows: GetRecentContentReturns,
  category: content_category | null,
  defaultCategory: content_category = 'agents'
): DisplayableContent[] {
  if (rows.length === 0) return [];
  return rows.map((row: GetRecentContentReturns[number], index: number) => {
    const resolvedCategory = category ?? row.category;
    const validCategory = isValidCategory(resolvedCategory)
      ? (resolvedCategory as content_category)
      : defaultCategory;
    return toHomepageContentItem({
      author: row.author ?? 'Community',
      category: validCategory,
      // Use static fallback timestamp instead of new Date() (build-time safe)
      // contentModel has created_at as Date, convert to ISO string
      created_at:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : (row.created_at ?? '1970-01-01T00:00:00.000Z'),
      date_added:
        row.date_added instanceof Date
          ? row.date_added.toISOString()
          : (row.date_added ?? row.created_at instanceof Date)
            ? row.created_at.toISOString()
            : (row.created_at ?? '1970-01-01T00:00:00.000Z'),
      description: row.description ?? '',
      featuredRank: index + 1,
      slug: row.slug ?? '',
      tags: row.tags ?? [],
      title: row.title ?? null,
    });
  });
}
