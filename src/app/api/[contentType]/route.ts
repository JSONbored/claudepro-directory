import { agents, collections, commands, hooks, mcp, rules, statuslines, skills } from '@/generated/content';
import { contentCache } from '@/src/lib/cache';
import { createApiRoute } from '@/src/lib/error-handler';
import { rateLimiters } from '@/src/lib/rate-limiter';
import { apiSchemas } from '@/src/lib/security/validators';

export const runtime = 'nodejs';

// Content type mapping with async data getters
const contentMap = {
  'agents.json': { getData: () => agents, type: 'agent' },
  'mcp.json': { getData: () => mcp, type: 'mcp' },
  'hooks.json': { getData: () => hooks, type: 'hook' },
  'commands.json': { getData: () => commands, type: 'command' },
  'rules.json': { getData: () => rules, type: 'rule' },
  'statuslines.json': { getData: () => statuslines, type: 'statusline' },
  'collections.json': { getData: () => collections, type: 'collection' },
  'skills.json': { getData: () => skills, type: 'skill' },
} as const;

const route = createApiRoute({
  validate: {
    params: apiSchemas.contentTypeParams,
  },
  rateLimit: { limiter: rateLimiters.api },
  response: { envelope: false },
  handlers: {
    GET: async ({ params, okRaw, logger: requestLogger }) => {
      const { contentType } = params as { contentType: string };

      requestLogger.info('Content type API request started', {
        contentType,
        validated: true,
      });

      // Try to get from cache first
      const cacheKey = `content-api:${contentType}`;
      const cachedResponse = await contentCache.getAPIResponse(cacheKey);
      if (cachedResponse) {
        requestLogger.info('Serving cached content API response', {
          contentType,
          source: 'redis-cache',
        });
        return okRaw(cachedResponse, {
          sMaxAge: 14400,
          staleWhileRevalidate: 86400,
          cacheHit: true,
        });
      }

      // Check if the content type is valid
      if (!(contentType in contentMap)) {
        requestLogger.warn('Invalid content type requested', {
          contentType,
          availableTypesCount: Object.keys(contentMap).length,
          sampleType: Object.keys(contentMap)[0] || '',
        });

        return okRaw(
          {
            error: 'Content type not found',
            message: `Available content types: ${Object.keys(contentMap).join(', ')}`,
            timestamp: new Date().toISOString(),
          },
          { sMaxAge: 0, staleWhileRevalidate: 0, status: 404 }
        );
      }

      const { getData, type } = contentMap[contentType as keyof typeof contentMap];
      const data = await getData();
      const contentCategory = contentType.replace('.json', '');

      const responseData = {
        [contentCategory]: data.map((item: { slug: string; [key: string]: unknown }) => ({
          ...item,
          type,
          url: `https://claudepro.directory/${contentCategory}/${item.slug}`,
        })),
        count: data.length,
        lastUpdated: new Date().toISOString(),
      } as Record<string, unknown>;

      // Cache the response for 1 hour
      await contentCache.cacheAPIResponse(cacheKey, responseData, 60 * 60);

      requestLogger.info('Content type API request completed successfully', {
        contentType,
        count: data.length,
      });

      return okRaw(responseData, { sMaxAge: 14400, staleWhileRevalidate: 86400, cacheHit: false });
    },
  },
});

// Export a GET that matches Next.js dynamic route signature exactly
export async function GET(
  request: Request,
  context: { params: Promise<{ contentType: string }> }
): Promise<Response> {
  // Delegate to standardized handler (createApiRoute)
  if (!route.GET) {
    // Should never happen because handler is provided
    return new Response('Method Not Allowed', { status: 405 });
  }
  // Cast to NextRequest for our internal types
  return route.GET(request as unknown as import('next/server').NextRequest, context as any);
}
