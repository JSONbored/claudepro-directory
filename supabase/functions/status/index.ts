/**
 * Status - API health check endpoint
 */

import { getHeadCorsHeaders } from '../_shared/utils/cors.ts';
import { errorResponse, methodNotAllowedResponse } from '../_shared/utils/response.ts';
import { supabaseAnon } from '../_shared/utils/supabase.ts';

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getHeadCorsHeaders });
  }

  const isHead = req.method === 'HEAD';

  if (req.method !== 'GET' && !isHead) {
    return methodNotAllowedResponse('GET, HEAD', getHeadCorsHeaders);
  }

  try {
    const { data, error } = await supabaseAnon.rpc('get_api_health');

    if (error) {
      console.error('Health check RPC error:', error);
      return errorResponse(error, 'get_api_health', getHeadCorsHeaders);
    }

    const health = data as unknown as HealthStatus;

    if (
      !health ||
      typeof health.status !== 'string' ||
      !['healthy', 'degraded', 'unhealthy'].includes(health.status)
    ) {
      throw new Error('Invalid health status response from database');
    }

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    const payload = JSON.stringify(health);

    return new Response(isHead ? null : payload, {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'CDN-Cache-Control': 'max-age=60',
        'X-Content-Type-Options': 'nosniff',
        ...getHeadCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Status edge function error:', error);
    return errorResponse(error as Error, 'status', getHeadCorsHeaders);
  }
});
