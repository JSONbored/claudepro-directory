/**
 * Gallery API Route - Infinite scroll pagination
 * Returns gallery items for client-side loading
 */

import { NextResponse } from 'next/server';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const limit = Number.parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_gallery_trending', {
    ...(category && { p_category: category }),
    p_limit: limit,
    p_offset: offset,
    p_days_back: 90,
  });

  if (error) {
    logger.error('Gallery API error', error, {
      category: category || 'all',
      page,
      limit,
      source: 'GalleryAPI',
    });
    return NextResponse.json({ items: [], error: error.message }, { status: 500 });
  }

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
}
