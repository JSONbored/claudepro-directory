import type { Database as DatabaseGenerated, Json } from '../../_shared/database.types.ts';
import { callRpc } from '../../_shared/database-overrides.ts';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  methodNotAllowedResponse,
} from '../../_shared/utils/http.ts';
import { sanitizeRoute } from '../../_shared/utils/input-validation.ts';
import { serializeJsonLd } from '../../_shared/utils/jsonld.ts';
import type { BaseLogContext } from '../../_shared/utils/logging.ts';
import { logInfo, logWarn } from '../../_shared/utils/logging.ts';
import { buildSecurityHeaders } from '../../_shared/utils/security-headers.ts';

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

  const rpcArgs = {
    p_route: route,
    p_include: include,
  } satisfies DatabaseGenerated['public']['Functions']['generate_metadata_complete']['Args'];
  const { data, error } = await callRpc('generate_metadata_complete', rpcArgs, true);

  if (error) {
    return errorResponse(error, 'data-api:generate_metadata_complete', CORS);
  }

  if (!data) {
    return badRequestResponse('SEO generation failed: RPC returned null', CORS);
  }

  // Use Json type from generated types (runtime validation ensures structure)
  // Function returns union type based on p_include parameter
  const typedData = data as Json &
    (
      | {
          title: string;
          description: string;
          keywords: string[];
          openGraphType: 'profile' | 'website';
          twitterCard: 'summary_large_image';
          robots: {
            index: boolean;
            follow: boolean;
          };
          _debug?: {
            pattern: string;
            route: string;
            category?: string;
            slug?: string;
            error?: string;
          };
        }
      | {
          metadata: {
            title: string;
            description: string;
            keywords: string[];
            openGraphType: 'profile' | 'website';
            twitterCard: 'summary_large_image';
            robots: {
              index: boolean;
              follow: boolean;
            };
            _debug?: {
              pattern: string;
              route: string;
              category?: string;
              slug?: string;
              error?: string;
            };
          };
          schemas: Json[];
        }
    );

  // Serialize JSON-LD schemas with XSS protection if schemas are included
  // Use type narrowing with discriminated union
  let processedData: typeof typedData = typedData;
  if ('schemas' in typedData && typedData.schemas && Array.isArray(typedData.schemas)) {
    // TypeScript narrows to metadata+schemas case
    try {
      // Serialize each schema with XSS protection
      const schemasArray = typedData.schemas as Json[];
      const serializedSchemas = schemasArray.map((schema: Json) => serializeJsonLd(schema));
      processedData = {
        ...(typedData as Record<string, unknown>),
        schemas: serializedSchemas,
      } as typeof typedData;
    } catch {
      if (logContext) {
        logWarn('JSON-LD serialization failed, using original schemas', logContext);
      }
      // Fallback: use original schemas (edge function will still escape in JSON.stringify)
      processedData = typedData;
    }
  }

  const responseBody = JSON.stringify(processedData);

  if (logContext) {
    logInfo('SEO generated', {
      ...logContext,
      route,
      include,
      bytes: responseBody.length,
      schemasSerialized:
        'schemas' in typedData && Array.isArray(typedData.schemas) && typedData.schemas.length > 0,
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
}
