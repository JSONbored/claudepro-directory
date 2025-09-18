import { NextResponse } from 'next/server';

// Use Edge Runtime for faster response
export const runtime = 'edge';

// Cached stats - in production, these would come from a database or KV store
const STATS = {
  agents: 10,
  mcp: 10,
  rules: 10,
  commands: 10,
  hooks: 10,
  totalConfigurations: 50,
  lastUpdated: new Date().toISOString(),
};

export async function GET() {
  return NextResponse.json(STATS, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
