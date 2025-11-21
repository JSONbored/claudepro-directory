import { supabaseAnon } from '../../_shared/clients/supabase.ts';
import type { Database as DatabaseGenerated, Json } from '../../_shared/database.types.ts';
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
  const { data, error } = await supabaseAnon.rpc('generate_metadata_complete', rpcArgs);

  if (error) {
    return errorResponse(error, 'data-api:generate_metadata_complete', CORS);
  }

  if (!data) {
    return badRequestResponse('SEO generation failed: RPC returned null', CORS);
  }

  // Validate data structure without type assertion
  if (typeof data !== 'object' || data === null) {
    return badRequestResponse('SEO generation failed: invalid response', CORS);
  }

  // Safely extract properties
  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc?.value;
  };

  // Use validated data - TypeScript will infer types from runtime checks
  const typedData = data satisfies Json;

  // Serialize JSON-LD schemas with XSS protection if schemas are included
  // processedData will be Json type (either original or modified with serialized schemas)
  let processedData: Json = typedData;
  const schemasValue = getProperty(typedData, 'schemas');
  if (schemasValue && Array.isArray(schemasValue)) {
    // Validate each schema item is valid Json
    const isValidJsonArray = (arr: unknown): arr is Json[] => {
      if (!Array.isArray(arr)) return false;
      // Each item should be valid Json (string, number, boolean, null, object, or array)
      for (const item of arr) {
        const itemType = typeof item;
        if (
          itemType !== 'string' &&
          itemType !== 'number' &&
          itemType !== 'boolean' &&
          item !== null &&
          !(itemType === 'object' && item !== null) &&
          !Array.isArray(item)
        ) {
          return false;
        }
      }
      return true;
    };

    if (isValidJsonArray(schemasValue)) {
      try {
        // Serialize each schema with XSS protection
        const serializedSchemas = schemasValue.map((schema: Json) => serializeJsonLd(schema));
        // Build new object without type assertion - preserve all existing properties
        // Since typedData is Json (object), we can safely copy properties
        // All values from typedData are already Json, and serializedSchemas is Json[]
        if (typeof typedData === 'object' && typedData !== null && !Array.isArray(typedData)) {
          // Create a new object with all properties from typedData, replacing schemas
          // We'll use JSON.parse/stringify to create a clean copy, then replace schemas
          // This ensures all values remain Json-compatible
          const jsonString = JSON.stringify(typedData);
          const parsed = JSON.parse(jsonString);
          // Validate parsed result is an object
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            // Override schemas with serialized version (Json[])
            // Use bracket notation for index signature access
            parsed['schemas'] = serializedSchemas;
            // parsed is now { [key: string]: Json | undefined } which is the object part of Json
            processedData = parsed satisfies Json;
          } else {
            // Fallback if parsing failed
            processedData = typedData;
          }
        } else {
          // Fallback if typedData is not an object
          processedData = typedData;
        }
      } catch {
        if (logContext) {
          logWarn('JSON-LD serialization failed, using original schemas', logContext);
        }
        // Fallback: use original schemas (edge function will still escape in JSON.stringify)
        processedData = typedData;
      }
    }
  }

  const responseBody = JSON.stringify(processedData);

  if (logContext) {
    logInfo('SEO generated', {
      ...logContext,
      route,
      include,
      bytes: responseBody.length,
      schemasSerialized: schemasValue && Array.isArray(schemasValue) && schemasValue.length > 0,
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
