import { revalidateTag } from 'next/cache';

/**
 * Revalidate cache tags
 * @param tags - Array of cache tags to revalidate
 * @param cache - Cache type ('default' or 'layout')
 */
export function revalidateCacheTags(tags: string[], cache: 'default' | 'layout' = 'default'): void {
  for (const tag of tags) {
    revalidateTag(tag, cache);
  }
}
