/**
 * Content File Manager
 * Handles reading and writing content files in /content/ directory
 *
 * Supports the existing file structure:
 * /content/{type}/{slug}.json
 */

import { logger } from '@/src/lib/logger';
import type { ConfigSubmissionData } from '@/src/lib/schemas/form.schema';
import { fileExists, listFiles } from './client';

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
    logger.error(
      'Failed to find similar content',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Simple Levenshtein distance calculation
 * Used for fuzzy matching of slugs
 */
function levenshteinDistance(str1: string, str2: string): number {
  // Initialize matrix with proper dimensions - create 2D array filled with zeros
  const matrix: number[][] = Array.from({ length: str2.length + 1 }, () =>
    Array.from({ length: str1.length + 1 }, () => 0)
  );

  // Helper to safely get matrix value with bounds checking
  const getCell = (i: number, j: number): number => {
    const row = matrix[i];
    if (!row) {
      throw new Error(`Matrix row ${i} undefined - bounds: 0-${str2.length}`);
    }
    const value = row[j];
    if (value === undefined) {
      throw new Error(`Matrix cell [${i}][${j}] undefined - bounds: 0-${str1.length}`);
    }
    return value;
  };

  // Helper to safely set matrix value with bounds checking
  const setCell = (i: number, j: number, value: number): void => {
    const row = matrix[i];
    if (!row) {
      throw new Error(`Matrix row ${i} undefined - bounds: 0-${str2.length}`);
    }
    row[j] = value;
  };

  // Initialize first column
  for (let i = 0; i <= str2.length; i++) {
    setCell(i, 0, i);
  }

  // Initialize first row
  for (let j = 0; j <= str1.length; j++) {
    setCell(0, j, j);
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        setCell(i, j, getCell(i - 1, j - 1));
      } else {
        setCell(
          i,
          j,
          Math.min(
            getCell(i - 1, j - 1) + 1, // substitution
            getCell(i, j - 1) + 1, // insertion
            getCell(i - 1, j) + 1 // deletion
          )
        );
      }
    }
  }

  return getCell(str2.length, str1.length);
}

/**
 * Format submission data as JSON file content
 * Converts plaintext fields to proper JSON structure matching templates
 */
export function formatContentFile(data: ConfigSubmissionData & { slug: string }): string {
  const baseFields = {
    slug: data.slug,
    description: data.description,
    category: data.type,
    author: data.author,
    dateAdded: new Date().toISOString().split('T')[0],
    tags: data.tags,
    ...(data.github ? { github: data.github } : {}),
    source: 'community',
  };

  // biome-ignore lint/suspicious/noExplicitAny: Dynamic content object with type-specific fields added in switch statement
  let contentObject: any = { ...baseFields };

  // Build type-specific JSON from plaintext fields
  switch (data.type) {
    case 'agents':
      contentObject = {
        ...contentObject,
        content: data.systemPrompt, // Plaintext prompt becomes "content"
        configuration: {
          temperature: data.temperature,
          maxTokens: data.maxTokens,
        },
      };
      break;

    case 'rules':
      contentObject = {
        ...contentObject,
        content: data.rulesContent, // Plaintext rules becomes "content"
        configuration: {
          temperature: data.temperature,
          maxTokens: data.maxTokens,
        },
      };
      break;

    case 'commands':
      contentObject = {
        ...contentObject,
        content: data.commandContent, // Plaintext markdown becomes "content"
      };
      break;

    case 'hooks':
      contentObject = {
        ...contentObject,
        content: data.hookScript, // Plaintext bash becomes "content"
        hookType: data.hookType,
        triggeredBy: data.triggeredBy,
      };
      break;

    case 'statuslines':
      contentObject = {
        ...contentObject,
        content: data.statuslineScript, // Plaintext bash becomes "content"
        statuslineType: data.statuslineType,
        configuration: {
          format: 'bash',
          refreshInterval: data.refreshInterval,
          position: data.position,
          colorScheme: 'default',
        },
      };
      break;

    case 'mcp': {
      // Parse env vars from KEY=value format
      const envVars: Record<string, string> = {};
      if (data.envVars) {
        data.envVars.split('\n').forEach((line) => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length) {
            envVars[key.trim()] = valueParts.join('=').trim();
          }
        });
      }

      contentObject = {
        ...contentObject,
        npmPackage: data.npmPackage,
        serverType: data.serverType,
        installation: {
          npm: data.installCommand,
          configuration: {
            command: data.configCommand,
            args: [],
            ...(Object.keys(envVars).length > 0 ? { env: envVars } : {}),
          },
        },
        // Add tools array (simplified - maintainer can expand later)
        ...(data.toolsDescription
          ? {
              tools: [
                {
                  name: 'primary_tool',
                  description: data.toolsDescription,
                  parameters: {},
                },
              ],
            }
          : {}),
      };
      break;
    }
  }

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
    logger.error(
      'Content validation error',
      error instanceof Error ? error : new Error(String(error))
    );
    return false;
  }
}
