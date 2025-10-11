/**
 * URL Generation Utilities
 * Centralized URL generation logic for content items
 *
 * Production Standards:
 * - Type-safe with const assertions
 * - Handles nested route cases (guides subcategories)
 * - Single source of truth for URL construction
 * - Performance optimized with constant-time lookups
 */

import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';

/**
 * Guide subcategories that require special routing under /guides/ parent path
 * These categories use the route structure: /guides/[category]/[slug]
 * All other categories use: /[category]/[slug]
 *
 * @constant
 */
const GUIDE_SUBCATEGORIES = [
  'tutorials',
  'comparisons',
  'troubleshooting',
  'use-cases',
  'workflows',
  'categories',
] as const;

/**
 * Type for guide subcategories
 */
type GuideSubcategory = (typeof GUIDE_SUBCATEGORIES)[number];

/**
 * Generate the canonical URL path for a content item
 * Handles special routing cases like nested guide categories
 *
 * Architecture:
 * - Standard content: /[category]/[slug] (agents, mcp, rules, commands, hooks, statuslines)
 * - Guide content: /guides/[category]/[slug] (tutorials, workflows, comparisons, etc.)
 * - Collections: /collections/[slug]
 * - Jobs: /jobs/[slug]
 *
 * @param item - Content item with category and slug (or full UnifiedContentItem)
 * @returns Absolute path for the content item
 *
 * @example
 * // Guide subcategory - uses /guides/ prefix
 * getContentItemUrl({ category: 'tutorials', slug: 'getting-started' })
 * // Returns: "/guides/tutorials/getting-started"
 *
 * @example
 * // Standard category - direct routing
 * getContentItemUrl({ category: 'agents', slug: 'code-reviewer' })
 * // Returns: "/agents/code-reviewer"
 *
 * @example
 * // Collections and jobs use standard routing
 * getContentItemUrl({ category: 'collections', slug: 'awesome-mcp' })
 * // Returns: "/collections/awesome-mcp"
 */
export function getContentItemUrl(item: Pick<UnifiedContentItem, 'category' | 'slug'>): string {
  // Type guard for guide subcategories
  const isGuideSubcategory = (cat: string): cat is GuideSubcategory =>
    GUIDE_SUBCATEGORIES.includes(cat as GuideSubcategory);

  // Special case: guide subcategories need /guides/ prefix
  if (isGuideSubcategory(item.category)) {
    return `/guides/${item.category}/${item.slug}`;
  }

  // Standard routing for all other content types
  return `/${item.category}/${item.slug}`;
}

/**
 * Check if a category is a guide subcategory
 * Used for conditional rendering and routing logic
 *
 * @param category - Category to check
 * @returns true if category is a guide subcategory
 *
 * @example
 * isGuideSubcategory('tutorials')   // true
 * isGuideSubcategory('agents')      // false
 */
export function isGuideSubcategory(category: string): boolean {
  return GUIDE_SUBCATEGORIES.includes(category as GuideSubcategory);
}
