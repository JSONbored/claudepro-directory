import { type NextRequest, NextResponse } from 'next/server';
import { statsRedis } from '@/lib/redis';

// Use Node.js runtime for cost optimization
export const runtime = 'nodejs';

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
    const trending = await statsRedis.getTrending(category, limit);

    return NextResponse.json(
      {
        category,
        items: trending,
        count: trending.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching trending:', error);
    return NextResponse.json({ error: 'Failed to fetch trending items' }, { status: 500 });
  }
}
