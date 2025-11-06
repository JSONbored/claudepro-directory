/**
 * LLMs.txt Route - Proxy to Edge Function
 * 272 LOC → 52 LOC (81% reduction) via Edge Function + PostgreSQL RPC
 */

import { NextResponse } from 'next/server';
import { isValidCategory } from '@/src/lib/config/category-config';
import { logger } from '@/src/lib/logger';

const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/llms-txt`
  : 'https://hgtjdifxfapoltfflowc.supabase.co/functions/v1/llms-txt';

export async function GET(
  _request: Request,
  context: { params: Promise<{ category: string; slug: string }> }
): Promise<Response> {
  try {
    const { category, slug } = await context.params;

    logger.info('Item llms.txt request (edge proxy)', { category, slug });

    if (!isValidCategory(category)) {
      logger.warn('Invalid category requested for item llms.txt', { category, slug });
      return new NextResponse('Category not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, must-revalidate',
        },
      });
    }

    const edgeUrl = `${EDGE_FUNCTION_URL}?category=${encodeURIComponent(category)}&slug=${encodeURIComponent(slug)}`;
    const response = await fetch(edgeUrl);

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/plain; charset=utf-8',
        'Cache-Control': response.headers.get('Cache-Control') || 'public, s-maxage=3600',
        'X-Robots-Tag': 'index, follow',
      },
    });
  } catch (error: unknown) {
    const { category, slug } = await context.params.catch(() => ({
      category: 'unknown',
      slug: 'unknown',
    }));

    logger.error(
      'Failed to proxy llms.txt request',
      error instanceof Error ? error : new Error(String(error)),
      { category, slug }
    );

    return new NextResponse('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
