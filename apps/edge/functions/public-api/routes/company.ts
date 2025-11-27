import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  initRequestLogging,
  jsonResponse,
  methodNotAllowedResponse,
  supabaseAnon,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import { buildSecurityHeaders, createDataApiContext, logger } from '@heyclaude/shared-runtime';

const CORS = getOnlyCorsHeaders;

/**
 * Handle the /company public API route: validate request and return company profile for the provided slug.
 *
 * @param segments - Remaining path segments; must be empty for this route
 * @param url - Full request URL containing the `slug` query parameter
 * @param method - HTTP method of the request; only `GET` is allowed
 * @returns An HTTP Response with the company profile JSON on success (status 200), or an error JSON and appropriate status code (400 for bad requests, 404 when not found, 405 when method not allowed). Successful responses include security headers, CORS headers, cache headers for `company_profile`, and an `X-Generated-By` header.
 */
export async function handleCompanyRoute(
  segments: string[],
  url: URL,
  method: string
): Promise<Response> {
  const logContext = createDataApiContext('company', {
    path: url.pathname,
    method,
    app: 'public-api',
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Company request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: logContext.request_id,
    operation: logContext.action || 'company',
    method,
  });
  
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
  
  // Update bindings with slug
  logger.setBindings({
    slug,
  });
  traceStep(`Fetching company profile (slug: ${slug})`, logContext);

  const rpcArgs = {
    p_slug: slug,
  } satisfies DatabaseGenerated['public']['Functions']['get_company_profile']['Args'];
  const { data: profile, error } = await supabaseAnon.rpc('get_company_profile', rpcArgs);

  if (error) {
    // Use dbQuery serializer for consistent database query formatting
    return await errorResponse(error, 'data-api:get_company_profile', CORS, {
      ...logContext,
      dbQuery: {
        rpcName: 'get_company_profile',
        args: rpcArgs, // Will be redacted by Pino's redact config
      },
    });
  }

  if (!profile) {
    return jsonResponse({ error: 'Company not found' }, 404, CORS);
  }

  traceRequestComplete(logContext);
  return jsonResponse(profile, 200, {
    ...buildSecurityHeaders(),
    ...CORS,
    ...buildCacheHeaders('company_profile'),
    'X-Generated-By': 'supabase.rpc.get_company_profile',
  });
}