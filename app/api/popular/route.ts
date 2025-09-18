import { type NextRequest, NextResponse } from 'next/server';
import { statsRedis } from '@/lib/redis';

// Use Edge Runtime for faster response
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  if (!statsRedis.isEnabled()) {
    return NextResponse.json({ error: 'Stats tracking not enabled' }, { status: 503 });
  }

  if (!category) {
    return NextResponse.json({ error: 'Category parameter is required' }, { status: 400 });
  }

  const validCategories = ['agents', 'mcp', 'rules', 'commands', 'hooks'];
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  try {
    const popular = await statsRedis.getPopular(category, limit);

    return NextResponse.json(
      {
        category,
        items: popular,
        count: popular.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching popular:', error);
    return NextResponse.json({ error: 'Failed to fetch popular items' }, { status: 500 });
  }
}
