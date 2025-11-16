import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';
import { callRpc } from '../../_shared/database-overrides.ts';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  jsonResponse,
  methodNotAllowedResponse,
} from '../../_shared/utils/http.ts';

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
  const { data: profile, error } = await callRpc('get_company_profile', rpcArgs, true);

  if (error) {
    return errorResponse(error, 'data-api:get_company_profile', CORS);
  }

  if (!profile) {
    return jsonResponse({ error: 'Company not found' }, 404, CORS);
  }

  return new Response(JSON.stringify(profile), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Generated-By': 'supabase.rpc.get_company_profile',
      ...CORS,
      ...buildCacheHeaders('company_profile'),
    },
  });
}
