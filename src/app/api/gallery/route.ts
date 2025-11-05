/**
 * Gallery API Route - Infinite scroll pagination
 * Returns gallery items for client-side loading
 */

import { NextResponse } from 'next/server';
import { handleApiError } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    logger.info('Gallery API request', { category: category || 'all', page, limit });

    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_gallery_trending', {
      ...(category && { p_category: category }),
      p_limit: limit,
      p_offset: offset,
      p_days_back: 90,
    });

    if (error) {
      throw error;
    }

    logger.info('Gallery API success', {
      category: category || 'all',
      page,
      itemsReturned: data?.length || 0,
    });

    return NextResponse.json(
      {
        items: data || [],
        page,
        limit,
        hasMore: (data?.length || 0) >= limit,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: unknown) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = searchParams.get('page');

    return handleApiError(error, {
      route: '/api/gallery',
      operation: 'get_gallery_trending',
      method: 'GET',
      logContext: { category: category || 'all', page: page || '1' },
    });
  }
}
