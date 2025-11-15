/**
 * Server-side sidebar data fetching
 * Uses cached trending helper (shared with data-api) for internal consistency.
 */

import { getTrendingPageData } from '@/src/lib/data/content/trending';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

interface TrendingGuide {
  title: string;
  slug: string;
  views: string;
}

interface RecentGuide {
  title: string;
  slug: string;
  date: string;
}

interface SidebarData {
  trending: TrendingGuide[];
  recent: RecentGuide[];
}

export async function getSidebarData(limit = 5): Promise<SidebarData> {
  try {
    const data = await getTrendingPageData({ category: 'guides', limit });
    const trending = (data.trending || []).slice(0, limit).map((item) => ({
      title: item.title ?? item.slug,
      slug: `/${item.category ?? 'guides'}/${item.slug}`,
      views: `${Number((item as { viewCount?: number }).viewCount ?? 0).toLocaleString()} views`,
    }));

    const recent = (data.recent || []).slice(0, limit).map((item) => ({
      title: item.title ?? item.slug,
      slug: `/${item.category ?? 'guides'}/${item.slug}`,
      date: item.created_at
        ? new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '',
    }));

    return { trending, recent };
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load sidebar trending data');
    logger.error('SidebarData: trending fetch failed', normalized, { limit });
    return { trending: [], recent: [] };
  }
}
