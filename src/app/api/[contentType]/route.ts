/**
 * OPTIMIZATION: Import metadata-only files instead of full content
 * API endpoints only need metadata fields, not full content (5-40x smaller imports)
 */
import { agentsMetadata } from '@/generated/agents-metadata';
import { collectionsMetadata } from '@/generated/collections-metadata';
import { commandsMetadata } from '@/generated/commands-metadata';
import { hooksMetadata } from '@/generated/hooks-metadata';
import { mcpMetadata } from '@/generated/mcp-metadata';
import { rulesMetadata } from '@/generated/rules-metadata';
import { skillsMetadata } from '@/generated/skills-metadata';
import { statuslinesMetadata } from '@/generated/statuslines-metadata';
import { contentCache } from '@/src/lib/cache.server';
import { createApiRoute } from '@/src/lib/error-handler';
import { rateLimiters } from '@/src/lib/rate-limiter.server';
import { apiSchemas } from '@/src/lib/security/validators';

export const runtime = 'nodejs';

// Content type mapping with async data getters (using metadata-only imports)
const contentMap = {
  'agents.json': { getData: () => Promise.resolve(agentsMetadata), type: 'agent' },
  'mcp.json': { getData: () => Promise.resolve(mcpMetadata), type: 'mcp' },
  'hooks.json': { getData: () => Promise.resolve(hooksMetadata), type: 'hook' },
  'commands.json': { getData: () => Promise.resolve(commandsMetadata), type: 'command' },
  'rules.json': { getData: () => Promise.resolve(rulesMetadata), type: 'rule' },
  'statuslines.json': { getData: () => Promise.resolve(statuslinesMetadata), type: 'statusline' },
  'collections.json': { getData: () => Promise.resolve(collectionsMetadata), type: 'collection' },
  'skills.json': { getData: () => Promise.resolve(skillsMetadata), type: 'skill' },
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

// Export GET handler - directly delegates to createApiRoute standardized handler
export async function GET(
  request: Request,
  context: { params: Promise<{ contentType: string }> }
): Promise<Response> {
  if (!route.GET) {
    return new Response('Method Not Allowed', { status: 405 });
  }
  return route.GET(request, context);
}
