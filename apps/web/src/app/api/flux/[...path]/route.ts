/**
 * Flux Catch-All API Route
 *
 * Handles all flux operations via dynamic routing:
 * - GET  /api/flux/email/count           -> Newsletter subscriber count
 * - POST /api/flux/discord/direct        -> Send Discord notification
 * - GET  /api/flux/notifications/active  -> Get active notifications
 * - POST /api/flux/notifications/dismiss -> Dismiss notifications
 * - POST /api/flux/revalidation          -> Process revalidation queue
 * - POST /api/flux/webhook/external      -> Process external webhooks
 *
 * This replaces the flux-station Supabase Edge Functions.
 *
 * @see packages/web-runtime/src/flux for implementation
 */

import { routeFluxRequest, handleOptions } from '@heyclaude/web-runtime/flux';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import { type NextRequest } from 'next/server';

interface RouteContext {
  params: Promise<{
    path: string[];
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = generateRequestId();
  const params = await context.params;
  const reqLogger = logger.child({
    requestId,
    operation: 'FluxAPI',
    route: `/api/flux/${params.path.join('/')}`,
    method: 'GET',
  });
  reqLogger.debug('Flux GET request', { path: params.path });
  return routeFluxRequest('GET', params.path, request);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = generateRequestId();
  const params = await context.params;
  const reqLogger = logger.child({
    requestId,
    operation: 'FluxAPI',
    route: `/api/flux/${params.path.join('/')}`,
    method: 'POST',
  });
  reqLogger.debug('Flux POST request', { path: params.path });
  return routeFluxRequest('POST', params.path, request);
}

export function OPTIONS() {
  return handleOptions();
}
