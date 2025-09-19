import { NextResponse } from 'next/server';
import { agents } from '@/generated/content';

export const runtime = 'nodejs';
export const revalidate = 14400; // 4 hours

export async function GET() {
  const data = {
    agents: agents.map((agent) => ({
      ...agent,
      type: 'agent',
      url: `https://claudepro.directory/agents/${agent.slug}`,
    })),
    count: agents.length,
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
    },
  });
}
