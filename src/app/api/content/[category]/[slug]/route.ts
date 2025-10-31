/**
 * Dynamic JSON API for individual content items
 * Database-driven field filtering via category_configs.api_schema
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

const VALID_CATEGORIES = [
  'mcp',
  'hooks',
  'commands',
  'rules',
  'statuslines',
  'skills',
  'agents',
  'collections',
] as const;

export async function GET(
  request: Request,
  { params }: { params: { category: string; slug: string } }
) {
  const { category, slug } = params;

  // Validate category
  if (!VALID_CATEGORIES.includes(category as any)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const supabase = await createClient();

  // Call database RPC function for field filtering
  const { data, error } = await supabase.rpc('get_api_content', {
    p_category: category,
    p_slug: slug,
  });

  if (error) {
    console.error('API content error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    },
  });
}
