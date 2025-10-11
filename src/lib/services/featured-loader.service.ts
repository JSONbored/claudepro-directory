/**
 * Featured Content Loader Service
 * Loads and enriches current week's featured configs for display
 *
 * @module lib/services/featured-loader
 */

import { getContentByCategory } from '@/src/lib/content/content-loaders';
import { logger } from '@/src/lib/logger';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { createClient } from '@/src/lib/supabase/server';
import { getBatchTrendingData } from '@/src/lib/trending/calculator';

/**
 * Featured config record from database
 */
interface FeaturedConfigRecord {
  content_type: string;
  content_slug: string;
  rank: number;
  final_score: number;
}

/**
 * Get current week's start date (Monday)
 */
function getCurrentWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0] as string;
}

/**
 * Load all content items (cached in memory)
 */
const contentCategories = [
  'rules',
  'mcp',
  'agents',
  'commands',
  'hooks',
  'statuslines',
  'collections',
] as const;

/**
 * Fetch current week's featured configs from database
 */
async function fetchCurrentFeaturedConfigs(): Promise<FeaturedConfigRecord[]> {
  try {
    const supabase = await createClient();
    const weekStart = getCurrentWeekStart();

    const { data, error } = await supabase
      .from('featured_configs')
      .select('content_type, content_slug, rank, final_score')
      .eq('week_start', weekStart)
      .order('rank', { ascending: true });

    if (error) {
      logger.error(
        'Failed to fetch current featured configs',
        error instanceof Error ? error.message : String(error)
      );
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error(
      'Error fetching featured configs',
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

/**
 * Load and enrich current week's featured content items grouped by category
 *
 * - Fetches featured config records from database
 * - Loads full content items from content files
 * - Enriches with featured metadata (rank, score)
 * - Groups by category (rules, mcp, agents, etc.)
 * - Returns top 6 per category for featured sections
 *
 * @returns Record of category -> featured items (max 6 per category)
 */
export async function loadCurrentFeaturedContentByCategory(): Promise<
  Record<string, readonly UnifiedContentItem[]>
> {
  try {
    // Step 1: Fetch featured records from database
    const featuredRecords = await fetchCurrentFeaturedConfigs();

    if (featuredRecords.length === 0) {
      logger.info('No featured configs for current week - using popular content fallback');

      // Fallback: Load all content and use trending calculator to get popular items per category
      const [
        rulesData,
        mcpData,
        agentsData,
        commandsData,
        hooksData,
        statuslinesData,
        collectionsData,
      ] = await Promise.all([
        getContentByCategory('rules'),
        getContentByCategory('mcp'),
        getContentByCategory('agents'),
        getContentByCategory('commands'),
        getContentByCategory('hooks'),
        getContentByCategory('statuslines'),
        getContentByCategory('collections'),
      ]);

      // Use trending calculator to get popular content (same algorithm as /trending Popular tab)
      // Returns top 12 popular items by default across all categories
      const trendingData = await getBatchTrendingData({
        rules: rulesData,
        mcp: mcpData,
        agents: agentsData,
        commands: commandsData,
        hooks: hooksData,
        statuslines: statuslinesData,
        collections: collectionsData,
      });

      // Group popular items by category
      const fallbackResult: Record<string, readonly UnifiedContentItem[]> = {};
      for (const category of contentCategories) {
        // Filter popular items for this category and take top 6
        const categoryItems = trendingData.popular.filter((item) => item.category === category);
        if (categoryItems.length > 0) {
          fallbackResult[category] = categoryItems.slice(0, 6);
        }
      }

      logger.info('Loaded fallback featured content using popular algorithm', {
        categories: Object.keys(fallbackResult).join(', '),
        totalItems: Object.values(fallbackResult).reduce((sum, items) => sum + items.length, 0),
      });

      return fallbackResult;
    }

    // Step 2: Load all content in parallel
    const contentByCategory = await Promise.all(
      contentCategories.map(async (category) => ({
        category,
        items: await getContentByCategory(category),
      }))
    );

    // Step 3: Create lookup map: category:slug -> content item
    const contentMap = new Map<string, UnifiedContentItem>();
    for (const { category, items } of contentByCategory) {
      for (const item of items) {
        contentMap.set(`${category}:${item.slug}`, item);
      }
    }

    // Step 4: Group featured records by category
    const featuredByCategory: Record<string, UnifiedContentItem[]> = {};

    for (const record of featuredRecords) {
      const key = `${record.content_type}:${record.content_slug}`;
      const item = contentMap.get(key);

      if (!item) {
        logger.warn('Featured item not found in content', {
          category: record.content_type,
          slug: record.content_slug,
        });
        continue;
      }

      // Initialize category array if needed
      if (!featuredByCategory[record.content_type]) {
        featuredByCategory[record.content_type] = [];
      }

      // Add featured metadata
      const enrichedItem = {
        ...item,
        _featured: {
          rank: record.rank,
          score: record.final_score,
        },
      } as UnifiedContentItem;

      featuredByCategory[record.content_type]?.push(enrichedItem);
    }

    // Step 5: Limit to top 6 per category and sort by rank
    const result: Record<string, readonly UnifiedContentItem[]> = {};
    for (const [category, items] of Object.entries(featuredByCategory)) {
      result[category] = items
        .sort((a, b) => {
          const aRank =
            (a as UnifiedContentItem & { _featured?: { rank: number } })._featured?.rank ?? 999;
          const bRank =
            (b as UnifiedContentItem & { _featured?: { rank: number } })._featured?.rank ?? 999;
          return aRank - bRank;
        })
        .slice(0, 6);
    }

    logger.info('Loaded featured content by category', {
      categories: Object.keys(result).join(', '),
      totalItems: Object.values(result).reduce((sum, items) => sum + items.length, 0),
      weekStart: getCurrentWeekStart(),
    });

    return result;
  } catch (error) {
    logger.error(
      'Failed to load featured content by category',
      error instanceof Error ? error.message : String(error)
    );
    return {};
  }
}

/**
 * Load and enrich current week's featured content items (all categories combined)
 *
 * - Fetches featured config records from database
 * - Loads full content items from content files
 * - Enriches with featured metadata (rank, score)
 * - Returns sorted by rank
 *
 * @returns Array of featured content items with metadata
 */
export async function loadCurrentFeaturedContent(): Promise<readonly UnifiedContentItem[]> {
  try {
    // Step 1: Fetch featured records from database
    const featuredRecords = await fetchCurrentFeaturedConfigs();

    if (featuredRecords.length === 0) {
      logger.info('No featured configs for current week');
      return [];
    }

    // Step 2: Load all content in parallel
    const contentByCategory = await Promise.all(
      contentCategories.map(async (category) => ({
        category,
        items: await getContentByCategory(category),
      }))
    );

    // Step 3: Create lookup map: category:slug -> content item
    const contentMap = new Map<string, UnifiedContentItem>();
    for (const { category, items } of contentByCategory) {
      for (const item of items) {
        contentMap.set(`${category}:${item.slug}`, item);
      }
    }

    // Step 4: Resolve featured items and add metadata
    const featuredItems = featuredRecords
      .map((record) => {
        const key = `${record.content_type}:${record.content_slug}`;
        const item = contentMap.get(key);

        if (!item) {
          logger.warn('Featured item not found in content', {
            category: record.content_type,
            slug: record.content_slug,
          });
          return null;
        }

        return {
          ...item,
          // Add featured metadata (not in schema, but can be used by components)
          _featured: {
            rank: record.rank,
            score: record.final_score,
          },
        } as UnifiedContentItem;
      })
      .filter((item): item is UnifiedContentItem => item !== null);

    logger.info('Loaded featured content', {
      count: featuredItems.length,
      weekStart: getCurrentWeekStart(),
    });

    return featuredItems;
  } catch (error) {
    logger.error(
      'Failed to load featured content',
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

export const featuredLoaderService = {
  loadCurrentFeaturedContent,
  loadCurrentFeaturedContentByCategory,
  getCurrentWeekStart,
};
