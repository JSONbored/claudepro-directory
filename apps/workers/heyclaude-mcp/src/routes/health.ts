/**
 * Health Check Endpoint
 *
 * Returns server health and version information.
 */

/**
 * Handle health check request
 *
 * @returns Health check response
 */
export function handleHealth(): Response {
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'heyclaude-mcp',
      version: '1.1.0',
      protocol: '2025-11-25',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
