/**
 * API Health Check Endpoint - Database-First Architecture
 * All logic in PostgreSQL via get_api_health() RPC function
 */

import { NextResponse } from 'next/server';
import { handleApiError } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';
import { createAnonClient } from '@/src/lib/supabase/server-anon';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  apiVersion: string;
  checks: {
    database: { status: 'ok' | 'error'; latency?: number; error?: string };
    contentTable: { status: 'ok' | 'error'; count?: number; error?: string };
    categoryConfigs: { status: 'ok' | 'error'; count?: number; error?: string };
  };
}

export async function GET() {
  try {
    const supabase = createAnonClient();

    const { data, error } = await supabase.rpc('get_api_health');

    if (error) {
      throw error;
    }

    const health = data as unknown as HealthStatus;
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    logger.info('Health check completed', { status: health.status });

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    return handleApiError(error, {
      route: '/api/status',
      operation: 'get_api_health',
      method: 'GET',
    });
  }
}
