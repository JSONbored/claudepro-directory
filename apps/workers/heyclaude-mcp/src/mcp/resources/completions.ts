/**
 * Resource Completion Handlers
 *
 * Provides completion suggestions for resource template parameters.
 * Enables context-aware autocomplete for category, slug, and format parameters.
 */

import type { PrismaClient } from '@prisma/client';
import type { content_category } from '@prisma/client';
import { CategorySchema } from '../../lib/types';
import type { Logger } from '@heyclaude/cloudflare-runtime/logging/pino';

/**
 * Available export formats for resources
 */
const EXPORT_FORMATS = ['llms.txt', 'markdown', 'json', 'rss', 'atom'] as const;

/**
 * Get category completion suggestions
 *
 * @param value - Partial category value to filter by
 * @param prisma - Prisma client instance
 * @param logger - Logger instance
 * @returns Array of category slugs matching the prefix
 */
export async function getCategoryCompletions(
  value: string,
  prisma: PrismaClient,
  logger: Logger
): Promise<string[]> {
  try {
    // Get all categories from database
    const categories = await prisma.category_configs.findMany({
      select: { category: true },
      orderBy: { category: 'asc' },
    });

    const categorySlugs = categories.map((c) => c.category);
    const lowerValue = value.toLowerCase();

    // Filter categories that start with the input value
    return categorySlugs.filter((cat) => cat.toLowerCase().startsWith(lowerValue));
  } catch (error) {
    logger.error({ error, value }, 'Failed to get category completions');
    // Fallback to static list if database query fails
    return CategorySchema.options.filter((cat) => cat.toLowerCase().startsWith(value.toLowerCase()));
  }
}

/**
 * Get slug completion suggestions for a category
 *
 * @param value - Partial slug value to filter by
 * @param category - Category to filter slugs by (optional, for context-aware completion)
 * @param prisma - Prisma client instance
 * @param logger - Logger instance
 * @returns Array of slugs matching the prefix, optionally filtered by category
 */
export async function getSlugCompletions(
  value: string,
  category: string | undefined,
  prisma: PrismaClient,
  logger: Logger
): Promise<string[]> {
  try {
    const lowerValue = value.toLowerCase();

    // Build query conditions
    const where: {
      slug: { contains: string; mode: 'insensitive' };
      category?: content_category;
    } = {
      slug: {
        contains: lowerValue,
        mode: 'insensitive',
      },
    };

    // Add category filter if provided
    if (category && CategorySchema.safeParse(category).success) {
      where.category = category as content_category;
    }

    // Query content table for matching slugs
    const content = await prisma.content.findMany({
      where,
      select: { slug: true },
      take: 50, // Limit to 50 suggestions
      orderBy: { slug: 'asc' },
    });

    return content.map((c) => c.slug);
  } catch (error) {
    logger.error({ error, value, category }, 'Failed to get slug completions');
    return [];
  }
}

/**
 * Get format completion suggestions
 *
 * @param value - Partial format value to filter by
 * @returns Array of format names matching the prefix
 */
export function getFormatCompletions(value: string): string[] {
  const lowerValue = value.toLowerCase();
  return EXPORT_FORMATS.filter((format) => format.toLowerCase().startsWith(lowerValue));
}
