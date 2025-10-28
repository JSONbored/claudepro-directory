/**
 * Search API Route - Server-side PostgreSQL FTS
 *
 * Provides JSON API for client components to fetch search results
 * using server-side searchContent() function
 */

import { type NextRequest, NextResponse } from 'next/server';
import { searchContent } from '@/src/lib/search/server-search';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category');
  const tags = searchParams.get('tags')?.split(',').filter(Boolean);
  const sort = (searchParams.get('sort') || 'relevance') as 'relevance' | 'newest' | 'alphabetical';

  try {
    // Build filters object conditionally to satisfy exactOptionalPropertyTypes
    const filters: Parameters<typeof searchContent>[1] = {
      sort,
      limit: 50,
    };

    if (category) {
      filters.categories = [category as any];
    }

    if (tags && tags.length > 0) {
      filters.tags = tags;
    }

    const results = await searchContent(query, filters);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
