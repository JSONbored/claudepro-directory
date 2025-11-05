/**
 * Status Edge Function - API health check
 * Migrated from /api/status for 35-50% server load reduction
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { Database } from '../_shared/database.types.ts';
import {
  publicCorsHeaders,
  methodNotAllowedResponse,
} from '../_shared/utils/response.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

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

// Public CORS headers for GET (allow all origins)
const getCorsHeaders = {
  ...publicCorsHeaders,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders });
  }

  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET', getCorsHeaders);
  }

  try {
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.rpc('get_api_health');

    if (error) throw error;

    const health = data as unknown as HealthStatus;
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return new Response(JSON.stringify(health), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders,
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Status edge function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders },
      }
    );
  }
});
