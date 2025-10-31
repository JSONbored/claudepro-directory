/**
 * On-Demand ISR Revalidation - Database-First Architecture
 * Called by Supabase Database Webhook when SEO metadata changes
 *
 * Webhook payload format from Supabase:
 * {
 *   "type": "INSERT" | "UPDATE",
 *   "table": "page_metadata_cache",
 *   "record": { route: "/agents/code-reviewer", ... },
 *   "schema": "public",
 *   "old_record": null | { ... }
 * }
 */

import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret from header
    const secret = request.headers.get('x-webhook-secret');
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Supabase sends the record data
    const route = body.record?.route;

    // Validate route
    if (!route || typeof route !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid route in webhook payload' },
        { status: 400 }
      );
    }

    // Revalidate the route
    revalidatePath(route);

    return NextResponse.json({
      revalidated: true,
      route,
      type: body.type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Revalidation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
