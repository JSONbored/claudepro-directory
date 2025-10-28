/**
 * Search API Route - Database-First RPC via search_content_optimized()
 */

import { type NextRequest, NextResponse } from 'next/server';
import type { SearchFilters } from '@/src/lib/search/server-search';
import { searchContent } from '@/src/lib/search/server-search';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category');
  const tags = searchParams.get('tags')?.split(',').filter(Boolean);
  const sort = searchParams.get('sort') as SearchFilters['sort'];

  try {
    const filters: SearchFilters = {};

    if (sort) filters.sort = sort;
    if (category) filters.p_categories = [category];
    if (tags && tags.length > 0) filters.p_tags = tags;
    filters.p_limit = 50;

    const results = await searchContent(query, filters);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
