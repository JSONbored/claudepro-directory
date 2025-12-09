'use server';

/**
 * Server action to fetch full item data for recently viewed items
 * 
 * This ensures recently viewed cards have all the same properties as other cards.
 * Called from client component since recently viewed items are stored in localStorage.
 * 
 * Returns enriched_content_item directly (not mapped to HomepageContentItem) to preserve
 * all properties like author_profile_url, bookmark_count, source, etc.
 */

import { type Database } from '@heyclaude/database-types';
import { getContentBySlug } from '@heyclaude/web-runtime/data';
import { getAuthenticatedUser } from '@heyclaude/web-runtime/data';
import { type RecentlyViewedCategory } from '@heyclaude/web-runtime/hooks';
import { logger } from '@heyclaude/web-runtime/logging/server';
import { isValidCategory } from '@heyclaude/web-runtime/core';

export interface RecentlyViewedItemInput {
  category: string;
  slug: string;
  title: string;
  description: string;
  viewedAt: string;
  tags?: string[];
}

/**
 * Mapping from singular RecentlyViewedCategory to plural content_category enum value.
 * This is the correct mapping for database lookups (not route strings).
 * Single source of truth for valid categories.
 */
const RECENTLY_VIEWED_TO_CONTENT_CATEGORY: Record<RecentlyViewedCategory, Database['public']['Enums']['content_category']> = {
  agent: 'agents',
  mcp: 'mcp',
  hook: 'hooks',
  command: 'commands',
  rule: 'rules',
  statusline: 'statuslines',
  skill: 'skills',
  job: 'jobs',
} as const;

/**
 * Maps singular RecentlyViewedCategory to plural content_category enum value.
 * This is the correct mapping for database lookups (not route strings).
 * 
 * @param category - Singular RecentlyViewedCategory (e.g., 'agent', 'hook')
 * @returns Plural content_category enum value (e.g., 'agents', 'hooks'), or null if invalid
 */
function mapRecentlyViewedToContentCategory(
  category: RecentlyViewedCategory
): Database['public']['Enums']['content_category'] | null {
  return RECENTLY_VIEWED_TO_CONTENT_CATEGORY[category] ?? null;
}

/**
 * Fetch full item data for recently viewed items
 * Returns enriched_content_item directly to preserve all properties for ConfigCard
 * 
 * Security: Verifies user authentication before fetching item data to prevent unauthorized access.
 */
export async function fetchRecentlyViewedItems(
  items: RecentlyViewedItemInput[]
): Promise<Database['public']['CompositeTypes']['enriched_content_item'][]> {
  const reqLogger = logger.child({
    operation: 'fetchRecentlyViewedItems',
    module: 'actions/fetch-recently-viewed-items',
  });

  // Verify user authentication before fetching item data
  const { user } = await getAuthenticatedUser({
    requireUser: false,
    context: 'fetchRecentlyViewedItems',
  });

  if (!user) {
    reqLogger.warn({ section: 'authentication' }, 'fetchRecentlyViewedItems: unauthenticated access attempt');
    // Return empty array for unauthenticated users (graceful degradation)
    return [];
  }

  try {
    // Fetch all items in parallel
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        try {
          // Validate item.category is a valid RecentlyViewedCategory
          // Derive valid categories from the mapping to ensure single source of truth
          const validCategories = Object.keys(RECENTLY_VIEWED_TO_CONTENT_CATEGORY) as RecentlyViewedCategory[];
          
          if (!validCategories.includes(item.category as RecentlyViewedCategory)) {
            reqLogger.warn(
              {
                category: item.category,
                slug: item.slug,
              },
              'Invalid recently viewed category'
            );
            return null;
          }

          // Map singular RecentlyViewedCategory directly to plural content_category enum
          // (not via route strings - this is for database lookups)
          const category = mapRecentlyViewedToContentCategory(
            item.category as RecentlyViewedCategory
          );

          if (!category || !isValidCategory(category)) {
            reqLogger.warn(
              {
                inputCategory: item.category,
                mappedCategory: category,
                slug: item.slug,
              },
              'Failed to map recently viewed category to content_category enum'
            );
            return null;
          }

          // Fetch full item data
          const fullItem = await getContentBySlug(category, item.slug);

          if (!fullItem) {
            // Item no longer exists (deleted)
            reqLogger.warn(
              {
                category: item.category,
                slug: item.slug,
              },
              'Invalid recently viewed category'
            );
            return null;
          }

          // Return enriched_content_item directly - ConfigCard accepts this type
          // This preserves all properties: author_profile_url, bookmark_count, source, etc.
          return fullItem;
        } catch (error) {
          reqLogger.warn(
            {
              category: item.category,
              slug: item.slug,
              error: error instanceof Error ? error.message : String(error),
            },
            'Failed to fetch recently viewed item'
          );
          return null;
        }
      })
    );

    // Filter out null items (deleted content)
    const validItems = enrichedItems.filter(
      (item): item is Database['public']['CompositeTypes']['enriched_content_item'] => item !== null
    );

    reqLogger.info(
      {
        requested: items.length,
        found: validItems.length,
        missing: items.length - validItems.length,
      },
      'Fetched recently viewed items'
    );

    return validItems;
  } catch (error) {
    const errorForLogging = error instanceof Error ? error : new Error(String(error));
    reqLogger.error({ err: errorForLogging }, 'Failed to fetch recently viewed items');
    // Return empty array on error (graceful degradation)
    return [];
  }
}
