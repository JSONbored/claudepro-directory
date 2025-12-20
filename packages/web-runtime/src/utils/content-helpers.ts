/**
 * Content Helper Utilities
 *
 * Utilities for working with content items and metadata.
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '@heyclaude/data-layer/prisma';

type contentModel = Prisma.contentGetPayload<{}>;
// EnrichedContentItem was removed - use contentModel instead
type EnrichedContentItem = contentModel;

/**
 * Ensure a value is a string array, converting single strings to arrays.
 *
 * Handles various input types and normalizes them to a string array:
 * - Arrays of strings → Returns filtered array (only strings)
 * - Single string → Returns array with that string
 * - Other types → Returns empty array
 *
 * This function is useful for handling form data, API responses, or user input
 * where the value might be a single string or an array of strings.
 *
 * @param value - Value to convert to string array (can be string, string[], or other types)
 * @returns Array of strings (never null or undefined, always returns an array)
 *
 * @example
 * ```ts
 * ensureStringArray(['tag1', 'tag2']) // Returns: ['tag1', 'tag2']
 * ensureStringArray('single-tag') // Returns: ['single-tag']
 * ensureStringArray(null) // Returns: []
 * ensureStringArray([1, 'tag', null]) // Returns: ['tag'] (filters non-strings)
 * ```
 */
export function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    return [value];
  }
  return [];
}

// Type helper: Extract content type from Prisma query result
type ContentType = Awaited<ReturnType<typeof prisma.content.findUnique>>;

/**
 * Extract metadata object from a content item.
 *
 * Safely extracts the metadata field from content items, handling both
 * EnrichedContentItem (from RPC) and ContentType (from Prisma) formats.
 * Returns an empty object if metadata is missing or invalid.
 *
 * @param item - Content item (EnrichedContentItem or Prisma ContentType)
 * @returns Metadata object as Record<string, unknown>, or empty object if missing/invalid
 *
 * @example
 * ```ts
 * const item = { id: '1', metadata: { tags: ['tag1'], author: 'John' } };
 * getMetadata(item) // Returns: { tags: ['tag1'], author: 'John' }
 *
 * const itemWithoutMetadata = { id: '2' };
 * getMetadata(itemWithoutMetadata) // Returns: {}
 * ```
 */
export function getMetadata(
  item: EnrichedContentItem | NonNullable<ContentType>
): Record<string, unknown> {
  const metadata = 'metadata' in item ? item.metadata : null;
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata) && metadata !== null) {
    return metadata as Record<string, unknown>;
  }
  return {};
}
