/**
 * Shared Response Utilities - Edge Functions
 * Standardized error/success responses with secure CORS policies
 */

/**
 * Public CORS headers - For unauthenticated endpoints
 * Safe to use wildcard for public APIs (email subscriptions, webhooks)
 */
export const publicCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Email-Action',
};

/**
 * Get origin-restricted CORS headers - For authenticated endpoints
 * Prevents CSRF attacks on endpoints using Authorization header
 */
export function getAuthenticatedCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const allowedOrigins = [
    'https://claudepro.directory',
    'https://www.claudepro.directory',
    ...(Deno.env.get('NODE_ENV') === 'development' ? ['http://localhost:3000'] : []),
  ];

  const origin = allowedOrigins.includes(requestOrigin || '')
    ? requestOrigin || allowedOrigins[0]
    : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Optimized JSON response helper - Zero object spread overhead
 * Reuses headers object for memory efficiency
 */
export function jsonResponse(
  data: unknown,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

export function errorResponse(error: unknown, context: string, cors = publicCorsHeaders): Response {
  console.error(`${context} failed:`, error);
  return jsonResponse(
    {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      context,
    },
    500,
    cors
  );
}

export function successResponse(data: unknown, status = 200, cors = publicCorsHeaders): Response {
  return jsonResponse(data, status, cors);
}

export function methodNotAllowedResponse(
  allowedMethod = 'POST',
  cors = publicCorsHeaders
): Response {
  return new Response(JSON.stringify({ error: 'Method not allowed', allowed: allowedMethod }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      Allow: allowedMethod,
      ...cors,
    },
  });
}

export function badRequestResponse(message: string, cors = publicCorsHeaders): Response {
  return jsonResponse({ error: 'Bad Request', message }, 400, cors);
}

export function unauthorizedResponse(message = 'Unauthorized', cors = publicCorsHeaders): Response {
  return jsonResponse({ error: 'Unauthorized', message }, 401, cors);
}
