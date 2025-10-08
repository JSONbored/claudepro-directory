/**
 * Similarity Calculation Cron Job
 * Runs nightly to calculate content-content similarity scores
 *
 * Schedule: Daily at 3 AM UTC
 * Purpose: Pre-compute similar configs using content-based + collaborative signals
 * Performance: Batch processes to avoid timeouts
 */

import { NextResponse } from 'next/server';
import { lazyContentLoaders } from '@/src/components/shared/lazy-content-loaders';
import { logger } from '@/src/lib/logger';
import {
  calculateContentSimilarity,
  calculateCoBookmarkFrequencies,
  normalizeCoBookmarkFrequencies,
  validateSimilarityScore,
} from '@/src/lib/personalization/similar-configs';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { createClient } from '@/src/lib/supabase/server';

// Runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Verify cron secret
 */
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.warn('CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  try {
    // Verify cron authentication
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = performance.now();
    const supabase = await createClient();

    logger.info('Starting similarity calculation');

    // Load all content
    const [
      agentsData,
      mcpData,
      rulesData,
      commandsData,
      hooksData,
      statuslinesData,
      collectionsData,
    ] = await Promise.all([
      lazyContentLoaders.agents(),
      lazyContentLoaders.mcp(),
      lazyContentLoaders.rules(),
      lazyContentLoaders.commands(),
      lazyContentLoaders.hooks(),
      lazyContentLoaders.statuslines(),
      lazyContentLoaders.collections(),
    ]);

      const allContent: UnifiedContentItem[] = [
        ...agentsData.map((item: Record<string, unknown>) => ({ ...item, category: 'agents' as const })),
        ...mcpData.map((item: Record<string, unknown>) => ({ ...item, category: 'mcp' as const })),
        ...rulesData.map((item: Record<string, unknown>) => ({ ...item, category: 'rules' as const })),
        ...commandsData.map((item: Record<string, unknown>) => ({ ...item, category: 'commands' as const })),
        ...hooksData.map((item: Record<string, unknown>) => ({ ...item, category: 'hooks' as const })),
        ...statuslinesData.map((item: Record<string, unknown>) => ({ ...item, category: 'statuslines' as const })),
        ...collectionsData.map((item: Record<string, unknown>) => ({ ...item, category: 'collections' as const })),
      ] as UnifiedContentItem[];

    logger.info('Content loaded', { total_items: allContent.length });

    // Fetch all bookmarks for collaborative signal
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('user_id, content_type, content_slug');

    if (bookmarksError) {
      logger.warn('Failed to fetch bookmarks, will calculate without collaborative signal', undefined, {
        error_message: bookmarksError.message,
      });
    }

    // Calculate co-bookmark frequencies
    let normalizedFrequencies = new Map<string, Map<string, number>>();
    if (bookmarks && bookmarks.length > 0) {
      const coOccurrences = calculateCoBookmarkFrequencies(bookmarks);

      // Count total bookmarks per item
      const itemCounts = new Map<string, number>();
      for (const bookmark of bookmarks) {
        const key = `${bookmark.content_type}:${bookmark.content_slug}`;
        itemCounts.set(key, (itemCounts.get(key) || 0) + 1);
      }

      normalizedFrequencies = normalizeCoBookmarkFrequencies(coOccurrences, itemCounts);
      logger.info('Co-bookmark frequencies calculated', {
        unique_pairs: Array.from(normalizedFrequencies.values()).reduce(
          (sum, map) => sum + map.size,
          0
        ),
      });
    }

    // Calculate content similarities
    const similarities: Array<{
      content_a_type: string;
      content_a_slug: string;
      content_b_type: string;
      content_b_slug: string;
      similarity_score: number;
      similarity_factors: Record<string, number>;
    }> = [];

    let comparisons = 0;
    const SIMILARITY_THRESHOLD = 0.15; // Only store meaningful similarities

    // Calculate pairwise similarities
    for (let i = 0; i < allContent.length; i++) {
      const itemA = allContent[i];
      if (!itemA) continue;

      const itemAKey = `${itemA.category}:${itemA.slug}`;
      const itemAFreqs = normalizedFrequencies.get(itemAKey) || new Map();

      // Only calculate for a subset to avoid timeout (top 10 similar per item)
      const candidates = allContent.slice(i + 1);
      const itemBSimilarities: Array<{
        item: UnifiedContentItem;
        similarity: number;
        factors: Record<string, number>;
      }> = [];

      for (const itemB of candidates) {
        comparisons++;

        // Get co-bookmark frequency
        const itemBKey = `${itemB.category}:${itemB.slug}`;
        const coBookmarkFreq = itemAFreqs.get(itemBKey) || 0;

        // Calculate similarity
        const { similarity_score, factors } = calculateContentSimilarity(
          itemA,
          itemB,
          coBookmarkFreq
        );

        if (similarity_score >= SIMILARITY_THRESHOLD) {
          itemBSimilarities.push({
            item: itemB,
            similarity: similarity_score,
            factors,
          });
        }
      }

      // Sort and take top 20 similar items per content
      itemBSimilarities.sort((a, b) => b.similarity - a.similarity);
      const topSimilar = itemBSimilarities.slice(0, 20);

      for (const similar of topSimilar) {
        if (validateSimilarityScore(similar.similarity)) {
          similarities.push({
            content_a_type: itemA.category,
            content_a_slug: itemA.slug,
            content_b_type: similar.item.category,
            content_b_slug: similar.item.slug,
            similarity_score: similar.similarity,
            similarity_factors: similar.factors,
          });
        }
      }
    }

    logger.info('Similarities calculated', {
      total_comparisons: comparisons,
      meaningful_similarities: similarities.length,
    });

    // Batch upsert similarities
    if (similarities.length > 0) {
      const BATCH_SIZE = 1000;
      for (let i = 0; i < similarities.length; i += BATCH_SIZE) {
        const batch = similarities.slice(i, i + BATCH_SIZE);

        const { error: upsertError } = await supabase.from('content_similarities').upsert(
          batch.map((sim) => ({
            ...sim,
            calculated_at: new Date().toISOString(),
          })),
          {
            onConflict: 'content_a_type,content_a_slug,content_b_type,content_b_slug',
          }
        );

        if (upsertError) {
          logger.error('Failed to upsert similarity batch', upsertError);
        }
      }
    }

    const duration = performance.now() - startTime;

    logger.info('Similarity calculation complete', {
      total_similarities: similarities.length,
      duration_ms: Math.round(duration),
    });

    return NextResponse.json({
      success: true,
      total_similarities: similarities.length,
      total_comparisons: comparisons,
      duration_ms: Math.round(duration),
    });
  } catch (error) {
    logger.error(
      'Similarity calculation cron failed',
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
