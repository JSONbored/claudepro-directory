import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';
import { callRpc } from '../../_shared/database-overrides.ts';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  methodNotAllowedResponse,
} from '../../_shared/utils/http.ts';
import { serializeJsonLd } from '../../_shared/utils/jsonld.ts';
import type { BaseLogContext } from '../../_shared/utils/logging.ts';

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

  const route = url.searchParams.get('route');
  const include = url.searchParams.get('include') || 'metadata';

  if (!route) {
    return badRequestResponse(
      'Missing required parameter: route. Example: ?route=/agents/some-slug&include=metadata,schemas',
      CORS
    );
  }

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

  // Serialize JSON-LD schemas with XSS protection if schemas are included
  // processedData must be compatible with Json type for JSON.stringify
  let processedData: DatabaseGenerated['public']['Functions']['generate_metadata_complete']['Returns'] =
    data;
  if (include.includes('schemas') && typeof data === 'object' && data !== null) {
    const dataObj = data as { schemas?: unknown[]; metadata?: unknown };
    if (dataObj.schemas && Array.isArray(dataObj.schemas)) {
      try {
        // Serialize each schema with XSS protection
        const serializedSchemas = dataObj.schemas.map((schema) => serializeJsonLd(schema));
        // Ensure processedData matches the expected Json type
        processedData = {
          ...dataObj,
          schemas: serializedSchemas,
        } as DatabaseGenerated['public']['Functions']['generate_metadata_complete']['Returns'];
      } catch (error) {
        console.warn('[data-api] JSON-LD serialization failed, using original schemas', {
          ...(logContext || {}),
          error: error instanceof Error ? error.message : String(error),
        });
        // Fallback: use original schemas (edge function will still escape in JSON.stringify)
        processedData = data;
      }
    }
  }

  const responseBody = JSON.stringify(processedData);

  console.log('[data-api] SEO generated', {
    ...(logContext || {}),
    route,
    include,
    bytes: responseBody.length,
    schemasSerialized:
      include.includes('schemas') && Array.isArray((data as { schemas?: unknown[] })?.schemas),
  });

  return new Response(responseBody, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Generated-By': 'supabase.rpc.generate_metadata_complete',
      'X-Content-Source': 'PostgreSQL generate_metadata_complete',
      'X-Robots-Tag': 'index, follow',
      'X-Content-Type-Options': 'nosniff',
      ...CORS,
      ...buildCacheHeaders('seo'),
    },
  });
}
