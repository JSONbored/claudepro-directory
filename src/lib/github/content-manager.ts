/**
 * Content File Manager
 * Handles reading and writing content files in /content/ directory
 * 
 * Supports the existing file structure:
 * /content/{type}/{slug}.json
 */

import { logger } from '@/src/lib/logger';
import { fileExists, getFileContents, listFiles } from './client';
import type { ConfigSubmissionData } from '@/src/lib/schemas/form.schema';

/**
 * Content type to directory mapping
 */
export const CONTENT_PATHS = {
  agents: 'content/agents',
  mcp: 'content/mcp',
  rules: 'content/rules',
  commands: 'content/commands',
  hooks: 'content/hooks',
  statuslines: 'content/statuslines',
} as const;

/**
 * Generate slug from name
 * Converts "My Awesome Agent" → "my-awesome-agent"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Get file path for content type
 */
export function getContentFilePath(type: ConfigSubmissionData['type'], slug: string): string {
  const directory = CONTENT_PATHS[type];
  return `${directory}/${slug}.json`;
}

/**
 * Check if content with slug already exists
 */
export async function contentExists(
  type: ConfigSubmissionData['type'],
  slug: string
): Promise<boolean> {
  const filePath = getContentFilePath(type, slug);
  return await fileExists(filePath);
}

/**
 * Find similar content by name/slug
 * Returns array of similar slugs for duplicate detection
 */
export async function findSimilarContent(
  type: ConfigSubmissionData['type'],
  slug: string
): Promise<string[]> {
  try {
    const directory = CONTENT_PATHS[type];
    const files = await listFiles(directory);

    // Find similar slugs (Levenshtein distance or simple substring match)
    const similar = files
      .filter((filename) => {
        const existingSlug = filename.replace('.json', '');
        // Check for substring match or very similar slugs
        return (
          existingSlug.includes(slug) ||
          slug.includes(existingSlug) ||
          levenshteinDistance(existingSlug, slug) <= 3
        );
      })
      .map((filename) => filename.replace('.json', ''));

    return similar;
  } catch (error) {
    logger.error('Failed to find similar content', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Simple Levenshtein distance calculation
 * Used for fuzzy matching of slugs
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1, // substitution
          matrix[i]![j - 1]! + 1, // insertion
          matrix[i - 1]![j]! + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length]![str1.length]!;
}

/**
 * Format submission data as JSON file content
 * Matches existing content file structure
 */
export function formatContentFile(data: {
  slug: string;
  name: string;
  description: string;
  category: string;
  author: string;
  github?: string;
  content: string;
  tags: string[];
  type: ConfigSubmissionData['type'];
}): string {
  // Parse the content JSON to ensure it's valid
  const contentParsed = JSON.parse(data.content);

  // Build content object matching existing structure
  const contentObject = {
    slug: data.slug,
    description: data.description,
    category: data.type,
    author: data.author,
    dateAdded: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    tags: data.tags,
    ...(data.github ? { github: data.github } : {}),
    // Merge the parsed content JSON
    ...contentParsed,
    source: 'community',
  };

  // Pretty print with 2-space indentation (matches existing files)
  return JSON.stringify(contentObject, null, 2);
}

/**
 * Validate content file structure
 * Ensures the formatted content matches expected schema
 */
export function validateContentFile(content: string): boolean {
  try {
    const parsed = JSON.parse(content);

    // Check required fields
    const requiredFields = ['slug', 'description', 'category', 'author', 'dateAdded', 'tags'];

    for (const field of requiredFields) {
      if (!(field in parsed)) {
        logger.warn(`Content validation failed: Missing field "${field}"`);
        return false;
      }
    }

    // Validate types
    if (typeof parsed.slug !== 'string') return false;
    if (typeof parsed.description !== 'string') return false;
    if (typeof parsed.category !== 'string') return false;
    if (typeof parsed.author !== 'string') return false;
    if (typeof parsed.dateAdded !== 'string') return false;
    if (!Array.isArray(parsed.tags)) return false;

    return true;
  } catch (error) {
    logger.error('Content validation error', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}
