import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';
import {
  callRpc,
  type GenerateMetadataCompleteReturn,
  type Json,
} from '../../_shared/database-overrides.ts';
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

  // Type assertion to our return type (callRpc returns Json, we know the structure)
  const typedData = data as GenerateMetadataCompleteReturn;

  // Serialize JSON-LD schemas with XSS protection if schemas are included
  // Use type narrowing with discriminated union
  let processedData: GenerateMetadataCompleteReturn = typedData;
  if ('schemas' in typedData && typedData.schemas) {
    // TypeScript narrows to metadata+schemas case
    try {
      // Serialize each schema with XSS protection
      const serializedSchemas = typedData.schemas.map((schema: Json) => serializeJsonLd(schema));
      processedData = {
        ...typedData,
        schemas: serializedSchemas,
      };
    } catch (error) {
      console.warn('[data-api] JSON-LD serialization failed, using original schemas', {
        ...(logContext || {}),
        error: error instanceof Error ? error.message : String(error),
      });
      // Fallback: use original schemas (edge function will still escape in JSON.stringify)
      processedData = typedData;
    }
  }

  const responseBody = JSON.stringify(processedData);

  console.log('[data-api] SEO generated', {
    ...(logContext || {}),
    route,
    include,
    bytes: responseBody.length,
    schemasSerialized:
      'schemas' in typedData && Array.isArray(typedData.schemas) && typedData.schemas.length > 0,
  });

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
