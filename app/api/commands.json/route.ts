import { NextResponse } from 'next/server';
import { commands } from '@/generated/content';

export const runtime = 'nodejs';
export const revalidate = 14400;

export async function GET() {
  const data = {
    commands: commands.map((command) => ({
      ...command,
      type: 'command',
      url: `https://claudepro.directory/commands/${command.slug}`,
    })),
    count: commands.length,
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
    },
  });
}
