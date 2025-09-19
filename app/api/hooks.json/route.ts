import { NextResponse } from 'next/server';
import { hooks } from '@/generated/content';

export const runtime = 'nodejs';
export const revalidate = 14400;

export async function GET() {
  const data = {
    hooks: hooks.map((hook) => ({
      ...hook,
      type: 'hook',
      url: `https://claudepro.directory/hooks/${hook.slug}`,
    })),
    count: hooks.length,
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
    },
  });
}
