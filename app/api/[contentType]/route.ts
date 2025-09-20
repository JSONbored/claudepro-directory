import { NextResponse } from 'next/server';
import { agents, commands, hooks, mcp, rules } from '@/generated/content';

export const runtime = 'nodejs';
export const revalidate = 14400; // 4 hours

// Content type mapping
const contentMap = {
  'agents.json': { data: agents, type: 'agent' },
  'mcp.json': { data: mcp, type: 'mcp' },
  'hooks.json': { data: hooks, type: 'hook' },
  'commands.json': { data: commands, type: 'command' },
  'rules.json': { data: rules, type: 'rule' },
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ contentType: string }> }
) {
  try {
    const { contentType } = await params;

    // Check if the content type is valid
    if (!(contentType in contentMap)) {
      return NextResponse.json(
        {
          error: 'Content type not found',
          message: `Available content types: ${Object.keys(contentMap).join(', ')}`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const { data, type } = contentMap[contentType as keyof typeof contentMap];
    const contentCategory = contentType.replace('.json', '');

    const responseData = {
      [contentCategory]: data.map((item) => ({
        ...item,
        type,
        url: `https://claudepro.directory/${contentCategory}/${item.slug}`,
      })),
      count: data.length,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('API Error in [contentType] route:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to process request',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
