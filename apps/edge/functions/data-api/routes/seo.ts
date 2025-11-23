import { SeoService } from '@heyclaude/data-layer';
import type { Json } from '@heyclaude/database-types';
import { supabaseAnon } from '@heyclaude/edge-runtime/clients/supabase.ts';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  methodNotAllowedResponse,
} from '@heyclaude/edge-runtime/utils/http.ts';
import type { BaseLogContext } from '@heyclaude/shared-runtime';
import {
  buildSecurityHeaders,
  logInfo,
  logWarn,
  sanitizeRoute,
  serializeJsonLd,
} from '@heyclaude/shared-runtime';

const CORS = getOnlyCorsHeaders;

export async function handleSeoRoute(
  segments: string[],
  url: URL,
  method: string,
  logContext?: BaseLogContext
): Promise<Response> {
  if (method !== 'GET') {
    return methodNotAllowedResponse('GET', CORS);
  }

  if (segments.length > 0) {
    return badRequestResponse('SEO path does not accept nested segments', CORS);
  }

  const routeParam = url.searchParams.get('route');
  const include = url.searchParams.get('include') || 'metadata';

  if (!routeParam) {
    return badRequestResponse(
      'Missing required parameter: route. Example: ?route=/agents/some-slug&include=metadata,schemas',
      CORS
    );
  }

  // Sanitize route parameter
  const route = sanitizeRoute(routeParam);

  const service = new SeoService(supabaseAnon);

  try {
    const data = await service.generateMetadata(route, include);

    if (!data) {
      return badRequestResponse('SEO generation failed: RPC returned null', CORS);
    }

    // Use generated composite type directly - Supabase RPC automatically converts composite types to JSON
    // Field names are snake_case as defined in the composite type
    // Validate data structure matches expected composite type
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return badRequestResponse('SEO generation failed: invalid response structure', CORS);
    }

    // Type guard: validate the structure matches our composite type
    const dataObj = data as Record<string, unknown>;
    // Use bracket notation for Record<string, unknown> to satisfy TypeScript index signature requirements
    const hasMetadata =
      'metadata' in dataObj &&
      typeof dataObj['metadata'] === 'object' &&
      dataObj['metadata'] !== null;
    const hasSchemas = 'schemas' in dataObj;

    if (!hasMetadata) {
      return badRequestResponse('SEO generation failed: missing metadata field', CORS);
    }

    // Access properties safely - TypeScript will infer types from structure
    const metadataObj = dataObj['metadata'] as Record<string, unknown>;
    const schemasArray = (
      hasSchemas && Array.isArray(dataObj['schemas']) ? dataObj['schemas'] : []
    ) as Json[];

    // Serialize JSON-LD schemas with XSS protection if schemas are included
    let processedSchemas: Json[] = [];
    if (schemasArray.length > 0) {
      try {
        // Serialize each schema with XSS protection
        processedSchemas = schemasArray.map((schema: Json) => serializeJsonLd(schema));
      } catch {
        if (logContext) {
          logWarn('JSON-LD serialization failed, using original schemas', logContext);
        }
        // Fallback: use original schemas (edge function will still escape in JSON.stringify)
        processedSchemas = schemasArray;
      }
    }

    // Extract metadata fields safely
    // Use bracket notation for Record<string, unknown> to satisfy TypeScript index signature requirements
    const title = typeof metadataObj['title'] === 'string' ? metadataObj['title'] : '';
    const description =
      typeof metadataObj['description'] === 'string' ? metadataObj['description'] : '';
    const keywords = Array.isArray(metadataObj['keywords'])
      ? (metadataObj['keywords'] as string[])
      : [];
    const openGraphType = metadataObj['open_graph_type'] === 'profile' ? 'profile' : 'website';
    const twitterCard =
      typeof metadataObj['twitter_card'] === 'string'
        ? metadataObj['twitter_card']
        : 'summary_large_image';

    const robotsObj = metadataObj['robots'] as Record<string, unknown> | undefined;
    const robots = {
      index: typeof robotsObj?.['index'] === 'boolean' ? robotsObj['index'] : true,
      follow: typeof robotsObj?.['follow'] === 'boolean' ? robotsObj['follow'] : true,
    };

    const debugObj = metadataObj['debug'] as Record<string, unknown> | undefined;
    const debug = debugObj
      ? {
          pattern: typeof debugObj['pattern'] === 'string' ? debugObj['pattern'] : '',
          route: typeof debugObj['route'] === 'string' ? debugObj['route'] : '',
          ...(typeof debugObj['category'] === 'string' ? { category: debugObj['category'] } : {}),
          ...(typeof debugObj['slug'] === 'string' ? { slug: debugObj['slug'] } : {}),
          ...(typeof debugObj['error'] === 'string' ? { error: debugObj['error'] } : {}),
        }
      : undefined;

    // Build response with serialized schemas
    const responseData: Json = {
      metadata: {
        title,
        description,
        keywords,
        openGraphType,
        twitterCard,
        robots,
        ...(debug ? { _debug: debug } : {}),
      },
      schemas: processedSchemas,
    };

    const responseBody = JSON.stringify(responseData);

    if (logContext) {
      logInfo('SEO generated', {
        ...logContext,
        route,
        include,
        bytes: responseBody.length,
        schemasSerialized: processedSchemas.length > 0,
      });
    }

    return new Response(responseBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_metadata_complete',
        'X-Content-Source': 'PostgreSQL generate_metadata_complete',
        'X-Robots-Tag': 'index, follow',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('seo'),
      },
    });
  } catch (error) {
    return errorResponse(error, 'data-api:generate_metadata_complete', CORS);
  }
}
