import { NextResponse } from 'next/server';
import { rules } from '@/generated/content';

export const runtime = 'nodejs';
export const revalidate = 14400;

export async function GET() {
  const data = {
    rules: rules.map((rule) => ({
      ...rule,
      type: 'rule',
      url: `https://claudepro.directory/rules/${rule.slug}`,
    })),
    count: rules.length,
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
    },
  });
}
