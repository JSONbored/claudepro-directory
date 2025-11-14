/** Cache invalidation helpers - Next.js 16 revalidateTag wrapper */

import { revalidateTag } from 'next/cache';

/**
 * Revalidate cache tags using Next.js default profile
 * Profile: stale=5min, revalidate=15min, expire=never
 *
 * Usage:
 * const config = await cacheConfigs();
 * const tags = config['cache.invalidate.content_create'];
 * revalidateCacheTags(tags);
 */
export function revalidateCacheTags(tags: string[]): void {
  for (const tag of tags) {
    revalidateTag(tag, 'default');
  }
}
