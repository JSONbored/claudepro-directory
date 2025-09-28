'use server';

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { statsRedis } from '@/lib/redis';
import { type AnalyticsResponse, validateTrackingParams } from '@/lib/schemas/analytics.schema';

/**
 * Track a view event for content
 * Validates parameters to prevent data corruption
 */
export async function trackView(category: unknown, slug: unknown): Promise<AnalyticsResponse> {
  // LEGITIMATE: Server actions accept unknown for validation
  try {
    // Validate input parameters
    const validated = validateTrackingParams(category, slug);

    if (!statsRedis.isEnabled()) {
      logger.debug('Stats tracking not enabled', {
        category: validated.category,
        slug: validated.slug,
      });
      return { success: false, message: 'Stats tracking not enabled' };
    }

    const viewCount = await statsRedis.incrementView(validated.category, validated.slug);

    logger.info('View tracked successfully', {
      category: validated.category,
      slug: validated.slug,
      viewCount: viewCount ?? 0,
    });

    return { success: true, viewCount: viewCount ?? 0 };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid tracking parameters', {
        errorCount: error.issues.length,
        firstError: error.issues[0]?.message || 'Unknown validation error',
        category: String(category),
        slug: String(slug),
      });
      return {
        success: false,
        message: 'Invalid tracking parameters',
      };
    }

    logger.error(
      'Server action failed to track view',
      error instanceof Error ? error : new Error(String(error)),
      {
        category: String(category),
        slug: String(slug),
        action: 'trackView',
      }
    );
    return { success: false, message: 'Failed to track view' };
  }
}

/**
 * Track a copy event for content (e.g., code snippets)
 * Validates parameters to prevent data corruption
 */
export async function trackCopy(category: unknown, slug: unknown): Promise<AnalyticsResponse> {
  // LEGITIMATE: Server actions accept unknown for validation
  try {
    // Validate input parameters
    const validated = validateTrackingParams(category, slug);

    if (!statsRedis.isEnabled()) {
      logger.debug('Stats tracking not enabled', {
        category: validated.category,
        slug: validated.slug,
      });
      return { success: false, message: 'Stats tracking not enabled' };
    }

    await statsRedis.trackCopy(validated.category, validated.slug);

    logger.info('Copy tracked successfully', {
      category: validated.category,
      slug: validated.slug,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid tracking parameters for copy', {
        errorCount: error.issues.length,
        firstError: error.issues[0]?.message || 'Unknown validation error',
        category: String(category),
        slug: String(slug),
      });
      return {
        success: false,
        message: 'Invalid tracking parameters',
      };
    }

    logger.error(
      'Server action failed to track copy',
      error instanceof Error ? error : new Error(String(error)),
      {
        category: String(category),
        slug: String(slug),
        action: 'trackCopy',
      }
    );
    return { success: false, message: 'Failed to track copy' };
  }
}
