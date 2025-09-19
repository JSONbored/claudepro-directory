import { NextResponse } from 'next/server';
import { mcp } from '@/generated/content';

export const runtime = 'nodejs';
export const revalidate = 14400;

export async function GET() {
  const data = {
    mcp: mcp.map((server) => ({
      ...server,
      type: 'mcp',
      url: `https://claudepro.directory/mcp/${server.slug}`,
    })),
    count: mcp.length,
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
    },
  });
}
