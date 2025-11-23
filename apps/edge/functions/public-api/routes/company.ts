import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  jsonResponse,
  methodNotAllowedResponse,
  supabaseAnon,
} from '@heyclaude/edge-runtime';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';

const CORS = getOnlyCorsHeaders;

export async function handleCompanyRoute(
  segments: string[],
  url: URL,
  method: string
): Promise<Response> {
  if (segments.length > 0) {
    return badRequestResponse('Company route does not accept nested segments', CORS);
  }

  if (method !== 'GET') {
    return methodNotAllowedResponse('GET', CORS);
  }

  const slug = url.searchParams.get('slug')?.trim();
  if (!slug) {
    return badRequestResponse('Company slug is required', CORS);
  }

  const rpcArgs = {
    p_slug: slug,
  } satisfies DatabaseGenerated['public']['Functions']['get_company_profile']['Args'];
  const { data: profile, error } = await supabaseAnon.rpc('get_company_profile', rpcArgs);

  if (error) {
    return errorResponse(error, 'data-api:get_company_profile', CORS);
  }

  if (!profile) {
    return jsonResponse({ error: 'Company not found' }, 404, CORS);
  }

  return jsonResponse(profile, 200, {
    ...buildSecurityHeaders(),
    ...CORS,
    ...buildCacheHeaders('company_profile'),
    'X-Generated-By': 'supabase.rpc.get_company_profile',
  });
}
