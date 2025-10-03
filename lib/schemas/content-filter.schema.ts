/**
 * Content Filter Validation Schemas
 * Production-grade validation for content filtering and search operations
 * Ensures content category and author data integrity
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { nonEmptyString, shortString } from '@/lib/schemas/primitives/base-strings';

/**
 * UI Sort/Filter types (preserved from deprecated hooks)
 * Schemas removed - only types used in component.schema.ts
 */

// UI Sort options for sort-dropdown component
export type SortOption = 'popularity' | 'date' | 'name' | 'author';

export type SortDirection = 'asc' | 'desc';

/**
 * Helper to safely extract string arrays from content data
 * Used internally by extractFilterOptions
 */
function extractStringArray(
  values: unknown[],
  fieldName: string,
  maxLength: number = 100
): string[] {
  try {
    const stringSchema = nonEmptyString.max(maxLength);
    const uniqueValues = [...new Set(values)];

    return uniqueValues
      .filter(Boolean) // Remove falsy values
      .map((value) => {
        const parsed = stringSchema.safeParse(value);
        return parsed.success ? parsed.data : null;
      })
      .filter(Boolean) as string[];
  } catch (error) {
    logger.error(
      'Failed to extract string array for field',
      error instanceof Error ? error : new Error(String(error)),
      {
        fieldName: String(fieldName),
      }
    );
    return [];
  }
}

/**
 * Content filter options schema
 */
export const contentFilterOptionsSchema = z.object({
  categories: z.array(shortString.max(50)).max(20),
  tags: z.array(shortString.max(50)).max(100),
  authors: z.array(shortString.max(100)).max(50),
});

/**
 * Helper to safely extract filter options from content data
 */
export function extractFilterOptions(
  data: Array<{
    category?: unknown;
    author?: unknown;
    tags?: unknown[];
  }>
): z.infer<typeof contentFilterOptionsSchema> {
  try {
    const categories = extractStringArray(
      data.map((item) => item.category),
      'category',
      50
    );

    const authors = extractStringArray(
      data.map((item) => item.author),
      'author',
      100
    );

    const allTags = data.flatMap((item) => (Array.isArray(item.tags) ? item.tags : []));
    const tags = extractStringArray(allTags, 'tags', 50);

    const filterOptions = {
      categories: categories.slice(0, 20), // Limit to reasonable number
      tags: tags.slice(0, 100),
      authors: authors.slice(0, 50),
    };

    return contentFilterOptionsSchema.parse(filterOptions);
  } catch (error) {
    logger.error(
      'Failed to extract filter options',
      error instanceof Error ? error : new Error(String(error)),
      {}
    );
    return { categories: [], tags: [], authors: [] };
  }
}

/**
 * Type exports
 */
export type ContentFilterOptions = z.infer<typeof contentFilterOptionsSchema>;
