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
import { getCategoryRoute } from '@heyclaude/web-runtime/hooks';
import { logger } from '@heyclaude/web-runtime/logging/server';
import { generateRequestId } from '@heyclaude/web-runtime/logging/server';

export interface RecentlyViewedItemInput {
  category: string;
  slug: string;
  title: string;
  description: string;
  viewedAt: string;
  tags?: string[];
}

/**
 * Fetch full item data for recently viewed items
 * Returns enriched_content_item directly to preserve all properties for ConfigCard
 */
export async function fetchRecentlyViewedItems(
  items: RecentlyViewedItemInput[]
): Promise<Database['public']['CompositeTypes']['enriched_content_item'][]> {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'fetchRecentlyViewedItems',
    module: 'actions/fetch-recently-viewed-items',
  });

  try {
    // Fetch all items in parallel
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        try {
          // Convert singular category to plural (e.g., 'agent' -> 'agents')
          const categoryRoute = getCategoryRoute(
            item.category as Parameters<typeof getCategoryRoute>[0]
          );
          const category = categoryRoute as Database['public']['Enums']['content_category'];

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
