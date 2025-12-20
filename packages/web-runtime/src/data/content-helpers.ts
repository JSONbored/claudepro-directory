import 'server-only';
import { type content_category } from '@prisma/client';
import { cacheTag } from 'next/cache';

/**
 * Helper to create cache tags for content
 *
 * @param category - Content category (content_category type or string)
 * @param slug - Optional content slug
 * @param additionalTags - Optional additional tags to include
 * @returns Array of cache tag strings
 */
export function generateContentTags(
  category?: content_category | null | string,
  slug?: null | string,
  additionalTags: string[] = []
): string[] {
  const tags: string[] = ['content', ...additionalTags];

  if (category) {
    tags.push(`content-${category}`);
    if (slug) {
      tags.push(`content-${category}-${slug}`);
    }
  } else {
    tags.push('content-all');
  }

  return tags;
}

/**
 * Unified cache tag helpers for all data types
 *
 * These helpers provide consistent cache tag patterns across all data types.
 */

/**
 * Apply companies cache tags
 * @param slug - Optional company slug
 * @param additionalTags - Optional additional tags
 */
export function applyCompaniesCacheTags(slug?: null | string, additionalTags: string[] = []): void {
  const tags: string[] = ['companies', ...additionalTags];
  if (slug) {
    tags.push(`company-${slug}`);
  }
  for (const tag of tags) {
    cacheTag(tag);
  }
}

/**
 * Apply changelog cache tags
 * @param slug - Optional changelog entry slug
 * @param additionalTags - Optional additional tags
 */
export function applyChangelogCacheTags(slug?: null | string, additionalTags: string[] = []): void {
  const tags: string[] = ['changelog', ...additionalTags];
  if (slug) {
    tags.push(`changelog-${slug}`);
  }
  for (const tag of tags) {
    cacheTag(tag);
  }
}

/**
 * Apply community cache tags
 * @param additionalTags - Optional additional tags
 */
export function applyCommunityCacheTags(additionalTags: string[] = []): void {
  const tags: string[] = ['community', ...additionalTags];
  for (const tag of tags) {
    cacheTag(tag);
  }
}

/**
 * Apply marketing cache tags
 * @param additionalTags - Optional additional tags
 */
export function applyMarketingCacheTags(additionalTags: string[] = []): void {
  const tags: string[] = ['marketing', ...additionalTags];
  for (const tag of tags) {
    cacheTag(tag);
  }
}

/**
 * Apply layout cache tags
 * @param additionalTags - Optional additional tags
 */
export function applyLayoutCacheTags(additionalTags: string[] = []): void {
  const tags: string[] = ['layout', ...additionalTags];
  for (const tag of tags) {
    cacheTag(tag);
  }
}

/**
 * Apply announcements cache tags
 * @param additionalTags - Optional additional tags
 */
export function applyAnnouncementsCacheTags(additionalTags: string[] = []): void {
  const tags: string[] = ['announcements', ...additionalTags];
  for (const tag of tags) {
    cacheTag(tag);
  }
}

/**
 * Apply templates cache tags
 * @param category - Optional template category
 * @param additionalTags - Optional additional tags
 */
export function applyTemplatesCacheTags(
  category?: null | string,
  additionalTags: string[] = []
): void {
  const tags: string[] = ['templates', ...additionalTags];
  if (category) {
    tags.push(`templates-${category}`);
  }
  for (const tag of tags) {
    cacheTag(tag);
  }
}

/**
 * Apply contact cache tags
 * @param additionalTags - Optional additional tags
 */
export function applyContactCacheTags(additionalTags: string[] = []): void {
  const tags: string[] = ['contact', ...additionalTags];
  for (const tag of tags) {
    cacheTag(tag);
  }
}

/**
 * Helper to create cache tags for any resource type
 *
 * @param resourceType - The type of resource (e.g., 'jobs', 'companies', 'changelog')
 * @param resourceId - Optional resource identifier (e.g., slug, id)
 * @param additionalTags - Optional additional tags to include
 * @returns Array of cache tag strings
 */
export function generateResourceTags(
  resourceType: string,
  resourceId?: null | string,
  additionalTags: string[] = []
): string[] {
  const tags: string[] = [resourceType, ...additionalTags];
  if (resourceId) {
    tags.push(`${resourceType}-${resourceId}`);
  }
  return tags;
}

export function normalizeRpcResult<T>(result: null | T | T[] | undefined): null | T {
  if (result === null || result === undefined) {
    return null;
  }

  if (Array.isArray(result)) {
    return result.length > 0 ? (result[0] ?? null) : null;
  }

  return result;
}
