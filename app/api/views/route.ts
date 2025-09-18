import { type NextRequest, NextResponse } from 'next/server';
import { statsRedis } from '@/lib/redis';

// Use Edge Runtime for faster response
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const slug = searchParams.get('slug');

  if (!statsRedis.isEnabled()) {
    return NextResponse.json({ error: 'Stats tracking not enabled' }, { status: 503 });
  }

  if (!category || !slug) {
    return NextResponse.json(
      { error: 'Both category and slug parameters are required' },
      { status: 400 }
    );
  }

  const validCategories = ['agents', 'mcp', 'rules', 'commands', 'hooks'];
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  try {
    const viewCount = await statsRedis.getViewCount(category, slug);

    return NextResponse.json(
      {
        category,
        slug,
        views: viewCount,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching view count:', error);
    return NextResponse.json({ error: 'Failed to fetch view count' }, { status: 500 });
  }
}
