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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be set');
}

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

// Public CORS headers for GET/HEAD (allow all origins)
const getCorsHeaders = {
  ...publicCorsHeaders,
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders });
  }

  const isHead = req.method === 'HEAD';

  if (req.method !== 'GET' && !isHead) {
    return methodNotAllowedResponse('GET, HEAD', getCorsHeaders);
  }

  try {
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.rpc('get_api_health');

    if (error) throw error;

    const health = data as unknown as HealthStatus;

    // Validate response structure
    if (!health || typeof health.status !== 'string' || !['healthy', 'degraded', 'unhealthy'].includes(health.status)) {
      throw new Error('Invalid health status response from database');
    }

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    const payload = JSON.stringify(health);

    return new Response(isHead ? null : payload, {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'CDN-Cache-Control': 'max-age=60',
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
