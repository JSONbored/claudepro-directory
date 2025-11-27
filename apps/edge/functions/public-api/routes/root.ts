import { getOnlyCorsHeaders, initRequestLogging, jsonResponse, traceRequestComplete, traceStep, type StandardContext } from '@heyclaude/edge-runtime';
import { logger } from '@heyclaude/shared-runtime';

const BASE_CORS = getOnlyCorsHeaders;

// Use StandardContext directly
type PublicApiContext = StandardContext;

/**
 * Returns a JSON index of available public API endpoints.
 *
 * @param ctx - PublicApiContext containing the incoming Request and the original HTTP method.
 * @returns A Response with status 200 and a JSON body `{ ok: true, resources: [...] }` plus CORS headers; when `ctx.originalMethod` is `'HEAD'` the response has no body but preserves status and headers.
 */
export async function handleDirectoryIndex(ctx: PublicApiContext): Promise<Response> {
  // Extract request ID from header if present (for distributed tracing), otherwise generate new one
  const incomingRequestId = ctx.request.headers.get('x-request-id')?.trim() || 
                            ctx.request.headers.get('X-Request-ID')?.trim();
  const requestId = incomingRequestId && incomingRequestId.length > 0 
    ? incomingRequestId 
    : crypto.randomUUID();
  
  // Initialize request logging with trace and bindings
  const logContext = {
    function: 'public-api',
    action: 'directory-index',
    request_id: requestId,
    started_at: new Date().toISOString(),
  };
  
  initRequestLogging(logContext);
  traceStep('Directory index request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: logContext.request_id,
    operation: logContext.action || 'directory-index',
    method: ctx.originalMethod,
  });
  const response = jsonResponse(
    {
      ok: true,
      resources: [
        {
          path: 'content/sitewide',
          description: 'Sitewide README + LLM exports',
        },
        {
          path: 'content/paginated',
          description: 'Paginated content listings',
        },
        { path: 'content/changelog', description: 'Changelog index + entries' },
        {
          path: 'content/:category/:slug',
          description: 'Content exports (JSON/Markdown/LLMs/storage)',
        },
        {
          path: 'content/generate-package',
          description:
            'Generate package for content (Skills ZIP, MCP .mcpb, etc.) - Internal only (POST)',
          method: 'POST',
        },
        {
          path: 'content/mcp/:slug?action=generate',
          description: 'Check if .mcpb package exists for MCP server (POST)',
          method: 'POST',
        },
        { path: 'company', description: 'Public company profile' },
        { path: 'seo', description: 'Metadata + schema JSON for any route' },
        {
          path: 'feeds',
          description: 'RSS/Atom feeds for content & changelog',
        },
        {
          path: 'sitemap',
          description: 'Sitemap XML/JSON + IndexNow submitter',
        },
        { path: 'status', description: 'API health check' },
        {
          path: 'trending',
          description: 'Trending/popular/recent content data',
        },
        { path: 'og', description: 'Open Graph Image Generation' },
        { path: 'search', description: 'Unified Search API' },
        { path: 'transform', description: 'Content Transformation API' },
      ],
    },
    200,
    BASE_CORS
  );

  traceRequestComplete(logContext);
  
  if (ctx.originalMethod === 'HEAD') {
    return new Response(null, {
      status: response.status,
      headers: response.headers,
    });
  }

  return response;
}