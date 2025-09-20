'use server';

import { logger } from '@/lib/logger';
import { statsRedis } from '@/lib/redis';

export async function trackView(category: string, slug: string) {
  if (!statsRedis.isEnabled()) {
    return { success: false, message: 'Stats tracking not enabled' };
  }

  try {
    const viewCount = await statsRedis.incrementView(category, slug);
    return { success: true, viewCount };
  } catch (error) {
    logger.error(
      'Server action failed to track view',
      error instanceof Error ? error : new Error(String(error)),
      {
        category,
        slug,
        action: 'trackView',
      }
    );
    return { success: false, message: 'Failed to track view' };
  }
}

export async function trackCopy(category: string, slug: string) {
  if (!statsRedis.isEnabled()) {
    return { success: false, message: 'Stats tracking not enabled' };
  }

  try {
    await statsRedis.trackCopy(category, slug);
    return { success: true };
  } catch (error) {
    logger.error(
      'Server action failed to track copy',
      error instanceof Error ? error : new Error(String(error)),
      {
        category,
        slug,
        action: 'trackCopy',
      }
    );
    return { success: false, message: 'Failed to track copy' };
  }
}
