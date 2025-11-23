import { getOnlyCorsHeaders, jsonResponse, type StandardContext } from '@heyclaude/edge-runtime';

const BASE_CORS = getOnlyCorsHeaders;

// Use StandardContext directly
type PublicApiContext = StandardContext;

export async function handleDirectoryIndex(ctx: PublicApiContext): Promise<Response> {
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

  if (ctx.originalMethod === 'HEAD') {
    return new Response(null, {
      status: response.status,
      headers: response.headers,
    });
  }

  return response;
}
