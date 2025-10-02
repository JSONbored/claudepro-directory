/**
 * Dynamic Content Loading Utilities
 *
 * Provides unified content loading functions that work across all categories.
 * Replaces individual category-specific loaders with dynamic routing-based loaders.
 *
 * Features:
 * - Category-agnostic loading (works for agents, mcp, commands, rules, hooks, statuslines)
 * - Lazy loading for performance optimization
 * - Type-safe with proper error handling
 * - Supports both metadata and full content loading
 *
 * Used by:
 * - app/[category]/page.tsx (list pages)
 * - app/[category]/[slug]/page.tsx (detail pages)
 */

import { logger } from '@/lib/logger';
import type { UnifiedContentItem } from '@/lib/schemas/component.schema';

/**
 * Dynamically load content by category name
 *
 * @param category - The content category (agents, mcp, commands, rules, hooks, statuslines)
 * @returns Array of content items for the specified category
 */
export async function getContentByCategory(category: string): Promise<UnifiedContentItem[]> {
  try {
    const contentModule = await import('@/generated/content');

    // Map category to loader function
    const loaderMap: Record<string, () => Promise<UnifiedContentItem[]>> = {
      agents: contentModule.getAgents,
      mcp: contentModule.getMcp,
      commands: contentModule.getCommands,
      rules: contentModule.getRules,
      hooks: contentModule.getHooks,
      statuslines: contentModule.getStatuslines,
    };

    const loader = loaderMap[category];
    if (!loader) {
      logger.error('Invalid category for content loading', new Error('Category not found'), {
        category,
        availableCategories: Object.keys(loaderMap).join(', '),
      });
      return [];
    }

    return await loader();
  } catch (error) {
    logger.error(
      `Failed to load content for category: ${category}`,
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Dynamically load single item by category and slug
 *
 * @param category - The content category
 * @param slug - The item slug
 * @returns The content item or null if not found
 */
export async function getContentBySlug(
  category: string,
  slug: string
): Promise<UnifiedContentItem | null> {
  try {
    const contentModule = await import('@/generated/content');

    // Map category to slug loader function
    const bySlugMap: Record<string, (slug: string) => Promise<UnifiedContentItem | undefined>> = {
      agents: contentModule.getAgentBySlug,
      mcp: contentModule.getMcpBySlug,
      commands: contentModule.getCommandBySlug,
      rules: contentModule.getRuleBySlug,
      hooks: contentModule.getHookBySlug,
      statuslines: contentModule.getStatuslineBySlug,
    };

    const loader = bySlugMap[category];
    if (!loader) {
      logger.warn('Invalid category for slug lookup', {
        category,
        slug,
      });
      return null;
    }

    const item = await loader(slug);
    return item || null;
  } catch (error) {
    logger.error(
      `Failed to load content by slug: ${category}/${slug}`,
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  }
}

/**
 * Dynamically load full content (with all fields) by category and slug
 *
 * Full content includes expanded data that may not be in metadata-only responses.
 * Falls back to metadata if full content is unavailable.
 *
 * @param category - The content category
 * @param slug - The item slug
 * @returns The full content item or null if not found
 */
export async function getFullContentBySlug(
  category: string,
  slug: string
): Promise<UnifiedContentItem | null> {
  try {
    const contentModule = await import('@/generated/content');

    // Map category to full content loader
    // Each category returns its specific type (AgentContent, MCPContent, etc.)
    // which are all compatible with UnifiedContentItem
    // Each loader can return null if the item is not found
    const fullContentMap: Record<string, (slug: string) => Promise<UnifiedContentItem | null>> = {
      agents: contentModule.getAgentFullContent,
      mcp: contentModule.getMcpFullContent,
      commands: contentModule.getCommandFullContent,
      rules: contentModule.getRuleFullContent,
      hooks: contentModule.getHookFullContent,
      statuslines: contentModule.getStatuslineFullContent,
    };

    const loader = fullContentMap[category];
    if (!loader) return null;

    const item = await loader(slug);
    return (item as UnifiedContentItem) || null;
  } catch (error) {
    logger.error(
      `Failed to load full content: ${category}/${slug}`,
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  }
}

/**
 * Get related items for a specific item (same category, different slug)
 *
 * @param category - The content category
 * @param currentSlug - The slug of the current item to exclude
 * @param limit - Maximum number of related items to return (default: 3)
 * @returns Array of related content items
 */
export async function getRelatedContent(
  category: string,
  currentSlug: string,
  limit: number = 3
): Promise<UnifiedContentItem[]> {
  const allContent = await getContentByCategory(category);

  return allContent.filter((item) => item.slug !== currentSlug).slice(0, limit);
}
