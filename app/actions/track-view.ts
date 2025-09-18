'use server';

import { statsRedis } from '@/lib/redis';

export async function trackView(category: string, slug: string) {
  if (!statsRedis.isEnabled()) {
    return { success: false, message: 'Stats tracking not enabled' };
  }

  try {
    const viewCount = await statsRedis.incrementView(category, slug);
    return { success: true, viewCount };
  } catch (error) {
    console.error('Failed to track view:', error);
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
    console.error('Failed to track copy:', error);
    return { success: false, message: 'Failed to track copy' };
  }
}
