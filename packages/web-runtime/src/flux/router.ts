/**
 * Flux Router
 *
 * Routes incoming requests to appropriate handlers based on path segments.
 */

import { NextRequest, NextResponse } from 'next/server';

import { handleEmailCount } from './handlers/email';
import { handleDiscordDirect } from './handlers/discord';
import { handleRevalidation } from './handlers/revalidation';
import { handleExternalWebhook } from './handlers/webhook';

// CORS headers for OPTIONS requests
const DEFAULT_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Discord-Notification-Type, X-Webhook-Source, X-Signature',
};

/**
 * Route a flux request based on path segments
 *
 * @param method - HTTP method
 * @param path - Path segments (e.g., ['email', 'count'])
 * @param request - Next.js request object
 */
export async function routeFluxRequest(
  method: string,
  path: string[],
  request: NextRequest
): Promise<NextResponse> {
  // Validate path has at least one segment
  if (!path || path.length === 0) {
    return NextResponse.json(
      { error: 'Route not found', path: '', method },
      { status: 404, headers: DEFAULT_CORS_HEADERS }
    );
  }

  const [module, action] = path;

  // Special case: revalidation has no action segment
  if (module === 'revalidation' && action === undefined && method === 'POST') {
    return handleRevalidation(request);
  }

  // Route based on module/action
  const route = `${module}/${action}`;

  switch (route) {
    case 'email/count':
      if (method === 'GET') {
        return handleEmailCount(request);
      }
      return NextResponse.json(
        { error: 'Method not allowed', path: route, method, allowedMethods: ['GET'] },
        { status: 405, headers: { ...DEFAULT_CORS_HEADERS, 'Allow': 'GET' } }
      );

    case 'discord/direct':
      if (method === 'POST') {
        return handleDiscordDirect(request);
      }
      return NextResponse.json(
        { error: 'Method not allowed', path: route, method, allowedMethods: ['POST'] },
        { status: 405, headers: { ...DEFAULT_CORS_HEADERS, 'Allow': 'POST' } }
      );

    case 'webhook/external':
      if (method === 'POST') {
        return handleExternalWebhook(request);
      }
      return NextResponse.json(
        { error: 'Method not allowed', path: route, method, allowedMethods: ['POST'] },
        { status: 405, headers: { ...DEFAULT_CORS_HEADERS, 'Allow': 'POST' } }
      );
  }

  // Route not found
  const safePath = Array.isArray(path) ? path.join('/') : '';
  return NextResponse.json(
    { error: 'Route not found', path: safePath, method },
    { status: 404, headers: DEFAULT_CORS_HEADERS }
  );
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: DEFAULT_CORS_HEADERS,
  });
}
