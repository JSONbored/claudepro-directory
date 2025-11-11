/**
 * Server-side sidebar data fetching - Edge Function Architecture
 * Calls trending edge function with CDN caching - all logic in PostgreSQL + edge function
 */

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
  const baseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hgtjdifxfapoltfflowc.supabase.co';

  try {
    const response = await fetch(
      `${baseUrl}/functions/v1/trending?mode=sidebar&category=guides&limit=${limit}`,
      {
        next: { revalidate: 86400, tags: ['trending'] },
      }
    );

    if (!response.ok) {
      return { trending: [], recent: [] };
    }

    const data = await response.json();
    return {
      trending: data.trending || [],
      recent: data.recent || [],
    };
  } catch {
    return { trending: [], recent: [] };
  }
}
