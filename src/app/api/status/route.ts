/**
 * API Health Check Endpoint - Database-First Architecture
 * Monitors database connectivity, cache status, and API availability
 */

import { NextResponse } from 'next/server';
import { createAnonClient } from '@/src/lib/supabase/server-anon';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  apiVersion: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
    contentTable: {
      status: 'ok' | 'error';
      count?: number;
      error?: string;
    };
    categoryConfigs: {
      status: 'ok' | 'error';
      count?: number;
      error?: string;
    };
  };
}

export async function GET() {
  const startTime = Date.now();
  const supabase = createAnonClient();

  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    apiVersion: '1.0.0',
    checks: {
      database: { status: 'ok' },
      contentTable: { status: 'ok' },
      categoryConfigs: { status: 'ok' },
    },
  };

  // Database connectivity check
  try {
    const dbStart = Date.now();
    const { error: dbError } = await supabase.from('content').select('id').limit(1).single();
    health.checks.database.latency = Date.now() - dbStart;

    if (dbError && dbError.code !== 'PGRST116') {
      // PGRST116 = no rows, which is ok for health check
      health.checks.database.status = 'error';
      health.checks.database.error = dbError.message;
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.database.status = 'error';
    health.checks.database.error = error instanceof Error ? error.message : 'Unknown error';
    health.status = 'unhealthy';
  }

  // Content table check
  try {
    const { count, error } = await supabase
      .from('content')
      .select('*', { count: 'exact', head: true });

    if (error) {
      health.checks.contentTable.status = 'error';
      health.checks.contentTable.error = error.message;
      health.status = 'degraded';
    } else {
      health.checks.contentTable.count = count || 0;
    }
  } catch (error) {
    health.checks.contentTable.status = 'error';
    health.checks.contentTable.error = error instanceof Error ? error.message : 'Unknown error';
    health.status = 'degraded';
  }

  // Category configs check
  try {
    const { count, error } = await supabase
      .from('category_configs')
      .select('*', { count: 'exact', head: true });

    if (error) {
      health.checks.categoryConfigs.status = 'error';
      health.checks.categoryConfigs.error = error.message;
      health.status = 'degraded';
    } else {
      health.checks.categoryConfigs.count = count || 0;
    }
  } catch (error) {
    health.checks.categoryConfigs.status = 'error';
    health.checks.categoryConfigs.error = error instanceof Error ? error.message : 'Unknown error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
