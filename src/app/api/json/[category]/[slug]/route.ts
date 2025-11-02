/**
 * Dynamic JSON API for individual content items
 * Database-driven field filtering, JSON-LD, and HTTP headers via PostgreSQL
 */

import { NextResponse } from 'next/server';
import { isValidCategory } from '@/src/lib/config/category-config';
import { APP_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';

interface ApiResponse {
  content: Record<string, unknown>;
  jsonld: Record<string, unknown>;
  httpHeaders: Record<string, string>;
  meta: {
    category: string;
    slug: string;
    generatedAt: string;
    apiVersion: string;
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string; slug: string }> }
) {
  const { category, slug: slugWithExt } = await params;
  const slug = slugWithExt.replace(/\.json$/, '');

  if (!isValidCategory(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_api_content', {
    p_category: category,
    p_slug: slug,
  });

  if (error) {
    logger.error('API content error', error, { category, slug, source: 'ContentAPI' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  const apiResponse = data as unknown as ApiResponse;

  // Merge JSON-LD into content for SEO-optimized response
  const enrichedContent = {
    ...apiResponse.content,
    '@context': apiResponse.jsonld['@context'],
    '@type': apiResponse.jsonld['@type'],
    structuredData: apiResponse.jsonld,
  };

  // Extract database-driven HTTP headers
  const dbHeaders = apiResponse.httpHeaders || {};

  // Build response headers from database config
  const responseHeaders: HeadersInit = {
    'Content-Type': 'application/json; charset=utf-8',
    ...dbHeaders,
    // SEO headers
    Link: `<${APP_CONFIG.url}/${category}/${slug}>; rel="canonical"`,
    'X-Robots-Tag': 'index, follow',
    'X-Content-Type-Options': 'nosniff',
  };

  return new NextResponse(JSON.stringify(enrichedContent, null, 2), {
    status: 200,
    headers: {
      ...responseHeaders,
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours CORS preflight cache
    },
  });
}
