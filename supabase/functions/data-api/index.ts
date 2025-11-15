import {
  errorResponse,
  getOnlyCorsHeaders,
  jsonResponse,
  methodNotAllowedResponse,
} from '../_shared/utils/http.ts';
import { handleCompanyRoute } from './routes/company.ts';
import { handleContentRoute } from './routes/content.ts';
import { handleFeedsRoute } from './routes/feeds.ts';
import { handleSeoRoute } from './routes/seo.ts';
import { handleSitemapRoute } from './routes/sitemap.ts';
import { handleStatusRoute } from './routes/status.ts';
import { handleTrendingRoute } from './routes/trending.ts';

const BASE_CORS = getOnlyCorsHeaders;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: BASE_CORS });
  }

  const method = req.method;

  if (method !== 'GET' && method !== 'HEAD' && method !== 'POST') {
    return methodNotAllowedResponse('GET, HEAD, POST', BASE_CORS);
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname.replace(/^\/data-api/, '');
    const segments = pathname.split('/').filter(Boolean);
    const normalizedMethod = method === 'HEAD' ? 'GET' : method;

    if (segments.length === 0) {
      const baseResponse = jsonResponse(
        {
          ok: true,
          resources: [
            'content/sitewide',
            'content/paginated',
            'feeds',
            'seo',
            'sitemap',
            'status',
            'company',
          ],
        },
        200,
        BASE_CORS
      );
      return method === 'HEAD'
        ? new Response(null, { status: baseResponse.status, headers: baseResponse.headers })
        : baseResponse;
    }

    const [resource, ...rest] = segments;
    let response: Response;

    switch (resource) {
      case 'content':
        response = await handleContentRoute(rest, url, normalizedMethod);
        break;
      case 'feeds':
        response = await handleFeedsRoute(rest, url, normalizedMethod);
        break;
      case 'seo':
        response = await handleSeoRoute(rest, url, normalizedMethod);
        break;
      case 'sitemap':
        response = await handleSitemapRoute(rest, url, normalizedMethod, req);
        break;
      case 'status':
        response = await handleStatusRoute(rest, url, normalizedMethod);
        break;
      case 'company':
        response = await handleCompanyRoute(rest, url, normalizedMethod);
        break;
      case 'trending':
        response = await handleTrendingRoute(rest, url, normalizedMethod);
        break;
      default:
        response = jsonResponse(
          { error: 'Not Found', message: 'Unknown data resource', path: `/${segments.join('/')}` },
          404,
          BASE_CORS
        );
        break;
    }

    if (method === 'HEAD') {
      return new Response(null, { status: response.status, headers: response.headers });
    }

    return response;
  } catch (error) {
    const errResponse = errorResponse(error, 'data-api', BASE_CORS);
    return method === 'HEAD'
      ? new Response(null, { status: errResponse.status, headers: errResponse.headers })
      : errResponse;
  }
});
