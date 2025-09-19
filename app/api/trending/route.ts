import { type NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { statsRedis } from '@/lib/redis';

// Use Node.js runtime for cost optimization
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const requestLogger = logger.forRequest(request);

  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  requestLogger.info('Trending API request received', {
    category,
    limit,
  });

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
    requestLogger.error(
      'API request failed to fetch trending items',
      error instanceof Error ? error : new Error(String(error)),
      {
        category,
        limit,
        validCategories,
      }
    );
    return NextResponse.json({ error: 'Failed to fetch trending items' }, { status: 500 });
  }
}
