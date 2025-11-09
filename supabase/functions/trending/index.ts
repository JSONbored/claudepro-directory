/**
 * Trending - Unified trending content endpoint
 * Modes: page (trending page with 3 tabs), sidebar (widget)
 */

import { getWithAuthCorsHeaders } from '../_shared/utils/cors.ts';
import {
  errorResponse,
  jsonResponse,
  methodNotAllowedResponse,
} from '../_shared/utils/response.ts';
import { supabaseAnon } from '../_shared/utils/supabase.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getWithAuthCorsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET', getWithAuthCorsHeaders);
  }

  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode') || 'page';
    const tab = url.searchParams.get('tab') || 'trending';
    const categoryParam = url.searchParams.get('category') || 'all';
    const limit = Number.parseInt(url.searchParams.get('limit') || '12', 10);

    // Validation
    if (!['page', 'sidebar'].includes(mode)) {
      return jsonResponse(
        { error: 'Invalid parameters', message: 'mode must be "page" or "sidebar"' },
        400,
        getWithAuthCorsHeaders
      );
    }

    if (mode === 'page' && !['trending', 'popular', 'recent'].includes(tab)) {
      return jsonResponse(
        { error: 'Invalid parameters', message: 'tab must be "trending", "popular", or "recent"' },
        400,
        getWithAuthCorsHeaders
      );
    }

    if (Number.isNaN(limit) || limit < 1 || limit > 100) {
      return jsonResponse(
        { error: 'Invalid parameters', message: 'limit must be between 1 and 100' },
        400,
        getWithAuthCorsHeaders
      );
    }

    const category = categoryParam === 'all' ? null : categoryParam;

    // SIDEBAR MODE: Trending + Recent for sidebar widget
    if (mode === 'sidebar') {
      const { data: trendingData, error: trendingError } = await supabaseAnon
        .from('mv_content_trending_metrics')
        .select('category, slug, views_total')
        .eq('category', category || 'guides')
        .order('views_total', { ascending: false })
        .limit(limit);

      if (trendingError) {
        console.error('Sidebar trending query error:', trendingError);
        return errorResponse(trendingError, 'sidebar-trending', getWithAuthCorsHeaders);
      }

      const { data: recentData, error: recentError } = await supabaseAnon
        .from('content')
        .select('slug, title, created_at')
        .eq('category', category || 'guides')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (recentError) {
        console.error('Sidebar recent query error:', recentError);
        return errorResponse(recentError, 'sidebar-recent', getWithAuthCorsHeaders);
      }

      // Get titles for trending items (need JOIN with content table)
      const trendingSlugs = trendingData.map((item) => item.slug);
      const { data: trendingContent, error: trendingContentError } = await supabaseAnon
        .from('content')
        .select('slug, title')
        .in('slug', trendingSlugs);

      if (trendingContentError) {
        console.error('Sidebar trending content query error:', trendingContentError);
        return errorResponse(
          trendingContentError,
          'sidebar-trending-content',
          getWithAuthCorsHeaders
        );
      }

      // Build title map
      const titleMap = new Map(trendingContent.map((item) => [item.slug, item.title]));

      const trending = trendingData.map((item) => ({
        title: titleMap.get(item.slug) || item.slug,
        slug: `/${item.category}/${item.slug}`,
        views: `${item.views_total.toLocaleString()} views`,
      }));

      const recent = recentData.map((item) => ({
        title: item.title,
        slug: `/${category || 'guides'}/${item.slug}`,
        date: new Date(item.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      }));

      return new Response(JSON.stringify({ trending, recent }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
          'CDN-Cache-Control': 'max-age=86400',
          ...getWithAuthCorsHeaders,
        },
      });
    }

    // PAGE MODE: Trending page with 3 tabs
    if (tab === 'trending') {
      // Query mv_content_trending_metrics for metrics
      let metricsQuery = supabaseAnon
        .from('mv_content_trending_metrics')
        .select(
          'category, slug, views_total, copies_total, bookmarks_total, trending_score, engagement_score, freshness_score'
        )
        .order('views_total', { ascending: false })
        .limit(limit);

      if (category) {
        metricsQuery = metricsQuery.eq('category', category);
      }

      const { data: metricsData, error: metricsError } = await metricsQuery;

      if (metricsError) {
        console.error('Trending metrics query error:', metricsError);
        return errorResponse(metricsError, 'trending-tab-metrics', getWithAuthCorsHeaders);
      }

      // Get corresponding content data
      const contentKeys = metricsData.map((item) => ({ category: item.category, slug: item.slug }));
      const { data: contentData, error: contentError } = await supabaseAnon
        .from('content')
        .select('category, slug, title, description, author, tags, source')
        .or(contentKeys.map((k) => `and(category.eq.${k.category},slug.eq.${k.slug})`).join(','));

      if (contentError) {
        console.error('Trending content query error:', contentError);
        return errorResponse(contentError, 'trending-tab-content', getWithAuthCorsHeaders);
      }

      // Build content map
      const contentMap = new Map(
        contentData.map((item) => [`${item.category}:${item.slug}`, item])
      );

      const trending = metricsData
        .map((item) => {
          const content = contentMap.get(`${item.category}:${item.slug}`);
          if (!content) return null;

          return {
            category: item.category,
            slug: item.slug,
            title: content.title,
            description: content.description,
            author: content.author,
            tags: content.tags,
            source: content.source,
            viewCount: item.views_total,
            copyCount: item.copies_total,
            bookmarkCount: item.bookmarks_total,
            trendingScore: item.trending_score,
            engagementScore: item.engagement_score,
            freshnessScore: item.freshness_score,
          };
        })
        .filter((item) => item !== null);

      return new Response(JSON.stringify({ trending, totalCount: trending.length }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
          'CDN-Cache-Control': 'max-age=86400',
          ...getWithAuthCorsHeaders,
        },
      });
    }

    if (tab === 'popular') {
      let query = supabaseAnon
        .from('mv_content_stats')
        .select(
          'category, slug, title, description, author, tags, view_count, copy_count, popularity_score'
        )
        .order('view_count', { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Popular tab query error:', error);
        return errorResponse(error, 'popular-tab', getWithAuthCorsHeaders);
      }

      const popular = data.map((item) => ({
        category: item.category,
        slug: item.slug,
        title: item.title,
        description: item.description,
        author: item.author,
        tags: item.tags,
        viewCount: item.view_count,
        copyCount: item.copy_count,
        popularityScore: item.popularity_score,
      }));

      return new Response(JSON.stringify({ popular, totalCount: popular.length }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
          'CDN-Cache-Control': 'max-age=86400',
          ...getWithAuthCorsHeaders,
        },
      });
    }

    if (tab === 'recent') {
      let query = supabaseAnon
        .from('content')
        .select(
          'category, slug, title, description, author, tags, source, date_added, view_count, copy_count'
        )
        .gte('date_added', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('date_added', { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Recent tab query error:', error);
        return errorResponse(error, 'recent-tab', getWithAuthCorsHeaders);
      }

      const recent = data.map((item) => ({
        category: item.category,
        slug: item.slug,
        title: item.title,
        description: item.description,
        author: item.author,
        tags: item.tags,
        source: item.source,
        dateAdded: item.date_added,
        viewCount: item.view_count,
        copyCount: item.copy_count,
      }));

      return new Response(JSON.stringify({ recent, totalCount: recent.length }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
          'CDN-Cache-Control': 'max-age=86400',
          ...getWithAuthCorsHeaders,
        },
      });
    }

    return jsonResponse(
      { error: 'Invalid parameters', message: 'Invalid tab parameter' },
      400,
      getWithAuthCorsHeaders
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error, 'trending', getWithAuthCorsHeaders);
  }
});
