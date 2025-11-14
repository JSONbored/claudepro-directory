/**
 * Trending - Unified trending content endpoint
 * Modes: page (trending page with 3 tabs), sidebar (widget)
 */

import {
  errorResponse,
  getWithAuthCorsHeaders,
  jsonResponse,
  methodNotAllowedResponse,
} from '../_shared/utils/http.ts';
import { supabaseAnon } from '../_shared/utils/supabase-clients.ts';

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
      const { data: trendingData, error: trendingError } = await supabaseAnon.rpc(
        'get_trending_metrics_with_content',
        {
          p_category: category || 'guides',
          p_limit: limit,
        }
      );

      if (trendingError) {
        console.error('Sidebar trending query error:', trendingError);
        return errorResponse(trendingError, 'sidebar-trending', getWithAuthCorsHeaders);
      }

      const { data: recentData, error: recentError } = await supabaseAnon.rpc(
        'get_recent_content',
        {
          p_category: category || 'guides',
          p_limit: limit,
          p_days: 30,
        }
      );

      if (recentError) {
        console.error('Sidebar recent query error:', recentError);
        return errorResponse(recentError, 'sidebar-recent', getWithAuthCorsHeaders);
      }

      const trending = (trendingData || []).map((item) => ({
        title: item.title || item.slug,
        slug: `/${item.category}/${item.slug}`,
        views: `${Number(item.views_total ?? 0).toLocaleString()} views`,
      }));

      const recent = (recentData || []).map((item) => {
        const createdAt = item.created_at ?? item.date_added ?? null;
        const displayCategory = item.category ?? category ?? 'guides';
        return {
          title: item.title,
          slug: `/${displayCategory}/${item.slug}`,
          date: createdAt
            ? new Date(createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : '',
        };
      });

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
      // Query get_trending_metrics_with_content RPC for combined data
      const { data: metricsData, error: metricsError } = await supabaseAnon.rpc(
        'get_trending_metrics_with_content',
        {
          p_category: category,
          p_limit: limit,
        }
      );

      if (metricsError) {
        console.error('Trending metrics query error:', metricsError);
        return errorResponse(metricsError, 'trending-tab-metrics', getWithAuthCorsHeaders);
      }

      const trending = (metricsData || []).map((item) => ({
        category: item.category,
        slug: item.slug,
        title: item.title,
        description: item.description,
        author: item.author,
        tags: item.tags,
        source: item.source,
        viewCount: item.views_total,
        copyCount: item.copies_total,
        bookmarkCount: item.bookmarks_total,
        trendingScore: item.trending_score,
        engagementScore: item.engagement_score,
        freshnessScore: item.freshness_score,
      }));

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
      const { data, error } = await supabaseAnon.rpc('get_popular_content', {
        p_category: category,
        p_limit: limit,
      });

      if (error) {
        console.error('Popular tab query error:', error);
        return errorResponse(error, 'popular-tab', getWithAuthCorsHeaders);
      }

      const popular = (data || []).map((item) => ({
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
      const { data, error } = await supabaseAnon.rpc('get_recent_content', {
        p_category: category,
        p_limit: limit,
        p_days: 30,
      });

      if (error) {
        console.error('Recent tab query error:', error);
        return errorResponse(error, 'recent-tab', getWithAuthCorsHeaders);
      }

      const recent = (data || []).map((item) => ({
        category: item.category,
        slug: item.slug,
        title: item.title,
        description: item.description,
        author: item.author,
        tags: item.tags,
        source: item.source,
        dateAdded: item.date_added ?? item.created_at,
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
