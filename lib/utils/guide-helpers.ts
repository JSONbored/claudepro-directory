/**
 * Guide Helper Utilities
 * Functions for parsing and loading guide content
 */

import { z } from 'zod';

/**
 * Schema for guide frontmatter metadata
 */
const guideFrontmatterSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  dateUpdated: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
});

/**
 * Schema for guide item
 */
const guideItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  slug: z.string(),
  dateUpdated: z.string().optional(),
});

/**
 * Schema for guide item with category (used in main guides page)
 */
export const guideItemWithCategorySchema = guideItemSchema.extend({
  category: z.string(),
});

/**
 * Schema for guides by category
 */
const guidesByCategorySchema = z.record(z.string(), z.array(guideItemWithCategorySchema));

export type GuideFrontmatter = z.infer<typeof guideFrontmatterSchema>;
export type GuideItem = z.infer<typeof guideItemSchema>;
export type GuideItemWithCategory = z.infer<typeof guideItemWithCategorySchema>;
export type GuidesByCategory = z.infer<typeof guidesByCategorySchema>;

/**
 * Parse frontmatter from MDX content with validation
 * Handles both single-line and multi-line values
 */
export function parseFrontmatter(content: string): GuideFrontmatter | null {
  try {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (!frontmatterMatch?.[1]) {
      return null;
    }

    const metadata: Record<string, string | string[]> = {};
    const lines = frontmatterMatch[1].split('\n');
    let currentKey: string | null = null;
    let currentValue: string[] = [];

    for (const line of lines) {
      // Check if line starts with a key (contains : and doesn't start with whitespace)
      if (line.match(/^[^\s].*:/)) {
        // Save previous key-value pair if exists
        if (currentKey) {
          const value = currentValue
            .join(' ')
            .trim()
            .replace(/^["']|["']$/g, '');

          // Handle arrays (tags)
          if (currentKey === 'tags' && value.startsWith('[')) {
            try {
              metadata[currentKey] = JSON.parse(value) as string[];
            } catch {
              metadata[currentKey] = value;
            }
          } else {
            metadata[currentKey] = value;
          }
        }

        // Start new key-value pair
        const [key, ...valueParts] = line.split(':');
        currentKey = key ? key.trim() : '';
        currentValue = [valueParts.join(':').trim()];
      } else if (currentKey) {
        // Continuation of multi-line value
        currentValue.push(line.trim());
      }
    }

    // Save the last key-value pair
    if (currentKey) {
      const value = currentValue
        .join(' ')
        .trim()
        .replace(/^["']|["']$/g, '');

      // Handle arrays (tags)
      if (currentKey === 'tags' && value.startsWith('[')) {
        try {
          metadata[currentKey] = JSON.parse(value) as string[];
        } catch {
          metadata[currentKey] = value;
        }
      } else {
        metadata[currentKey] = value;
      }
    }

    const result = guideFrontmatterSchema.safeParse(metadata);
    if (result.success) {
      return result.data;
    }

    // If validation fails, return what we have if it has minimum required fields
    if (metadata.title && metadata.description) {
      return {
        title: String(metadata.title),
        description: String(metadata.description),
        dateUpdated: metadata.dateUpdated ? String(metadata.dateUpdated) : undefined,
        author: metadata.author ? String(metadata.author) : undefined,
        tags: Array.isArray(metadata.tags) ? metadata.tags : undefined,
        category: metadata.category ? String(metadata.category) : undefined,
      } as GuideFrontmatter;
    }

    return null;
  } catch (_error) {
    // Don't log errors - frontmatter parsing is best-effort
    return null;
  }
}
