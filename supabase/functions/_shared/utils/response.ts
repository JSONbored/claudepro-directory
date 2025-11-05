/**
 * Shared Response Utilities - Edge Functions
 * Standardized error/success responses for all email handlers
 */

/**
 * CORS headers for cross-origin requests
 * Allows frontend to call Edge Functions directly
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Email-Action, Authorization',
};

export function errorResponse(error: unknown, context: string): Response {
  console.error(`${context} failed:`, error);
  return new Response(
    JSON.stringify({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      context,
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    }
  );
}

export function successResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

export function methodNotAllowedResponse(allowedMethod: string = 'POST'): Response {
  return new Response(
    JSON.stringify({ error: 'Method not allowed', allowed: allowedMethod }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': allowedMethod,
        ...corsHeaders,
      },
    }
  );
}

export function badRequestResponse(message: string): Response {
  return new Response(
    JSON.stringify({ error: 'Bad Request', message }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    }
  );
}

export function unauthorizedResponse(message: string = 'Unauthorized'): Response {
  return new Response(
    JSON.stringify({ error: 'Unauthorized', message }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    }
  );
}
