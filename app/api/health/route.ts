import { NextResponse } from 'next/server';

// Use Edge Runtime for faster response
export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}
