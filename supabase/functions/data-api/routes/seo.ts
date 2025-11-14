import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  methodNotAllowedResponse,
} from '../../_shared/utils/http.ts';
import { supabaseAnon } from '../../_shared/utils/supabase-clients.ts';

const CORS = getOnlyCorsHeaders;

export async function handleSeoRoute(
  segments: string[],
  url: URL,
  method: string
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

  const { data, error } = await supabaseAnon.rpc('generate_metadata_complete', {
    p_route: route,
    p_include: include,
  });

  if (error) {
    return errorResponse(error, 'data-api:generate_metadata_complete', CORS);
  }

  if (!data) {
    return badRequestResponse('SEO generation failed: RPC returned null', CORS);
  }

  const responseBody = JSON.stringify(data);

  console.log('[data-api] seo generated', {
    route,
    include,
    bytes: responseBody.length,
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
