/**
 * Server-side sidebar data fetching - ISR-compatible
 * Uses anonymous client for static/ISR pages
 */

import { createAnonClient } from '@/src/lib/supabase/server-anon';
import { slugToTitle } from '@/src/lib/utils';

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
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc('get_sidebar_guides_data', { p_limit: limit });

  if (error || !data) {
    return { trending: [], recent: [] };
  }

  const result = data as unknown as {
    trending: Array<{ slug: string; title: string; view_count: number }>;
    recent: Array<{ slug: string; title: string; created_at: string }>;
  };

  const trending: TrendingGuide[] = (result.trending || []).map((item) => ({
    title: item.title || `Guide: ${slugToTitle(item.slug)}`,
    slug: `/guides/${item.slug}`,
    views: `${item.view_count?.toLocaleString() || 0} views`,
  }));

  const recent: RecentGuide[] = (result.recent || []).map((item) => ({
    title: item.title || `Guide: ${slugToTitle(item.slug)}`,
    slug: `/guides/${item.slug}`,
    date: new Date(item.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  }));

  return { trending, recent };
}
