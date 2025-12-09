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
 * Maps singular RecentlyViewedCategory to plural content_category enum value.
 * This is the correct mapping for database lookups (not route strings).
 * 
 * @param category - Singular RecentlyViewedCategory (e.g., 'agent', 'hook')
 * @returns Plural content_category enum value (e.g., 'agents', 'hooks'), or null if invalid
 */
function mapRecentlyViewedToContentCategory(
  category: RecentlyViewedCategory
): Database['public']['Enums']['content_category'] | null {
  const mapping: Record<RecentlyViewedCategory, Database['public']['Enums']['content_category']> = {
    agent: 'agents',
    mcp: 'mcp',
    hook: 'hooks',
    command: 'commands',
    rule: 'rules',
    statusline: 'statuslines',
    skill: 'skills',
    job: 'jobs',
  };
  return mapping[category] ?? null;
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
    reqLogger.warn('fetchRecentlyViewedItems: unauthenticated access attempt', {
      section: 'authentication',
    });
    // Return empty array for unauthenticated users (graceful degradation)
    return [];
  }

  try {
    // Fetch all items in parallel
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        try {
          // Validate item.category is a valid RecentlyViewedCategory
          const validCategories: RecentlyViewedCategory[] = [
            'agent',
            'mcp',
            'hook',
            'command',
            'rule',
            'statusline',
            'skill',
            'job',
          ];
          
          if (!validCategories.includes(item.category as RecentlyViewedCategory)) {
            reqLogger.warn('Invalid recently viewed category', {
              category: item.category,
              slug: item.slug,
            });
            return null;
          }

          // Map singular RecentlyViewedCategory directly to plural content_category enum
          // (not via route strings - this is for database lookups)
          const category = mapRecentlyViewedToContentCategory(
            item.category as RecentlyViewedCategory
          );

          if (!category || !isValidCategory(category)) {
            reqLogger.warn('Failed to map recently viewed category to content_category enum', {
              inputCategory: item.category,
              mappedCategory: category,
              slug: item.slug,
            });
            return null;
          }

          // Fetch full item data
          const fullItem = await getContentBySlug(category, item.slug);

          if (!fullItem) {
            // Item no longer exists (deleted)
            reqLogger.warn('Recently viewed item not found', {
              category: item.category,
              slug: item.slug,
            });
            return null;
          }

          // Return enriched_content_item directly - ConfigCard accepts this type
          // This preserves all properties: author_profile_url, bookmark_count, source, etc.
          return fullItem;
        } catch (error) {
          reqLogger.warn('Failed to fetch recently viewed item', {
            category: item.category,
            slug: item.slug,
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        }
      })
    );

    // Filter out null items (deleted content)
    const validItems = enrichedItems.filter(
      (item): item is Database['public']['CompositeTypes']['enriched_content_item'] => item !== null
    );

    reqLogger.info('Fetched recently viewed items', {
      requested: items.length,
      found: validItems.length,
      missing: items.length - validItems.length,
    });

    return validItems;
  } catch (error) {
    const errorForLogging = error instanceof Error ? error : new Error(String(error));
    reqLogger.error('Failed to fetch recently viewed items', errorForLogging);
    // Return empty array on error (graceful degradation)
    return [];
  }
}
