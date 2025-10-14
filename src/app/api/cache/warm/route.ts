import { cacheWarmer } from '@/src/lib/cache';
import { createApiRoute } from '@/src/lib/error-handler';
import { apiSchemas, baseSchemas, validation } from '@/src/lib/security/validators';

/**
 * API endpoint to manually trigger cache warming
 * POST /api/cache/warm
 *
 * Rate limiting: 10 requests per hour (handled by middleware)
 * - Admin dashboard
 * - Cron job (Vercel Cron or GitHub Actions)
 * - Manual trigger for testing
 *
 * Security: Protected by Arcjet + endpoint-specific rate limiting
 */
const route = createApiRoute({
  validate: {
    headers: apiSchemas.requestHeaders.partial().pick({ authorization: true }),
    body: apiSchemas.cacheWarmParams.partial(),
    query: apiSchemas.paginationQuery.partial().pick({ limit: true }),
  },
  response: { envelope: false },
  handlers: {
    POST: async ({ headers, body, okRaw, request, logger: requestLogger }) => {
      // Validate authentication header if present (already schema-checked)
      if (headers?.authorization) {
        validation.validate(
          baseSchemas.authToken,
          String(headers.authorization).replace('Bearer ', ''),
          'authorization header'
        );
      }

      requestLogger.info('Cache warming triggered manually', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        hasParams: body && Object.keys(body as Record<string, unknown>).length > 0,
        validated: true,
      });

      const result = await cacheWarmer.triggerManualWarming();
      if (result.success) {
        return okRaw(
          { success: true, message: result.message, timestamp: new Date().toISOString() },
          { status: 200 }
        );
      }
      return okRaw(
        { success: false, message: result.message, timestamp: new Date().toISOString() },
        { status: 429 }
      );
    },

    GET: async ({ query, okRaw, logger: requestLogger }) => {
      const status = await cacheWarmer.getStatus();
      requestLogger.info('Cache status request', {
        limit: (query as { limit?: number })?.limit ?? 0,
        validated: true,
      });

      return okRaw(
        {
          ...(typeof status === 'object' && status !== null ? status : {}),
          currentTime: new Date().toISOString(),
          validated: true,
        },
        { status: 200 }
      );
    },
  },
});

export async function POST(request: Request): Promise<Response> {
  if (!route.POST) return new Response('Method Not Allowed', { status: 405 });
  return route.POST(request as unknown as import('next/server').NextRequest, { params: {} } as any);
}

export async function GET(
  request: Request,
  context: { params: Promise<{}> }
): Promise<Response> {
  if (!route.GET) return new Response('Method Not Allowed', { status: 405 });
  return route.GET(request as unknown as import('next/server').NextRequest, context as any);
}
