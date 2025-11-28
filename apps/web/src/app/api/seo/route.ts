/**
 * SEO Metadata API Route
 * Migrated from public-api edge function
 */

import 'server-only';

import { SeoService } from '@heyclaude/data-layer';
import type { Json } from '@heyclaude/database-types';
import { buildSecurityHeaders, sanitizeRoute, serializeJsonLd } from '@heyclaude/shared-runtime';
import {
  generateRequestId,
  logger,
  normalizeError,
  createErrorResponse,
} from '@heyclaude/web-runtime/logging/server';
import { createSupabaseAnonClient, badRequestResponse, getOnlyCorsHeaders, buildCacheHeaders  } from '@heyclaude/web-runtime/server';
import { NextRequest, NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'SeoAPI',
    route: '/api/seo',
    method: 'GET',
  });

  try {
    const url = new URL(request.url);
    const routeParam = url.searchParams.get('route');
    const include = url.searchParams.get('include') ?? 'metadata';

    if (!routeParam) {
      return badRequestResponse(
        'Missing required parameter: route. Example: ?route=/agents/some-slug&include=metadata,schemas',
        CORS
      );
    }

    // Sanitize route parameter
    const route = sanitizeRoute(routeParam);

    reqLogger.info('SEO request received', { route, include });

    const supabase = createSupabaseAnonClient();
    const service = new SeoService(supabase);
    const data = await service.generateMetadata({ p_route: route, p_include: include });
    const dataObj = data as Record<string, unknown>;
    const hasMetadata =
      'metadata' in dataObj &&
      typeof dataObj['metadata'] === 'object' &&
      dataObj['metadata'] !== null;
    const hasSchemas = 'schemas' in dataObj;

    if (!hasMetadata) {
      return badRequestResponse('SEO generation failed: missing metadata field', CORS);
    }

    const metadataObj = dataObj['metadata'] as Record<string, unknown>;
    const schemasArray = (
      hasSchemas && Array.isArray(dataObj['schemas']) ? dataObj['schemas'] : []
    ) as Json[];

    // Serialize JSON-LD schemas with XSS protection
    let processedSchemas: Json[] = [];
    if (schemasArray.length > 0) {
      try {
        processedSchemas = schemasArray.map((schema: Json) => serializeJsonLd(schema));
      } catch (error) {
        reqLogger.warn('JSON-LD serialization failed, omitting schemas for safety', {
          error: normalizeError(error),
        });
        processedSchemas = [];
      }
    }

    const title = typeof metadataObj['title'] === 'string' ? metadataObj['title'] : '';
    const description =
      typeof metadataObj['description'] === 'string' ? metadataObj['description'] : '';
    const keywords = Array.isArray(metadataObj['keywords'])
      ? (metadataObj['keywords'] as string[])
      : [];
    const openGraphType = metadataObj['open_graph_type'] === 'profile' ? 'profile' : 'website';
    const twitterCard =
      typeof metadataObj['twitter_card'] === 'string'
        ? metadataObj['twitter_card']
        : 'summary_large_image';

    const robotsObj = metadataObj['robots'] as Record<string, unknown> | undefined;
    const robots = {
      index: typeof robotsObj?.['index'] === 'boolean' ? robotsObj['index'] : true,
      follow: typeof robotsObj?.['follow'] === 'boolean' ? robotsObj['follow'] : true,
    };

    const debugObj = metadataObj['debug'] as Record<string, unknown> | undefined;
    const debug = debugObj
      ? {
          pattern: typeof debugObj['pattern'] === 'string' ? debugObj['pattern'] : '',
          route: typeof debugObj['route'] === 'string' ? debugObj['route'] : '',
          ...(typeof debugObj['category'] === 'string' ? { category: debugObj['category'] } : {}),
          ...(typeof debugObj['slug'] === 'string' ? { slug: debugObj['slug'] } : {}),
          ...(typeof debugObj['error'] === 'string' ? { error: debugObj['error'] } : {}),
        }
      : undefined;

    const responseData: Json = {
      metadata: {
        title,
        description,
        keywords,
        openGraphType,
        twitterCard,
        robots,
        ...(debug ? { _debug: debug } : {}),
      },
      schemas: processedSchemas,
    };

    const responseBody = JSON.stringify(responseData);

    reqLogger.info('SEO generated', {
      route,
      include,
      bytes: responseBody.length,
      schemasSerialized: processedSchemas.length > 0,
    });

    const robotsHeaderValue = `${robots.index ? 'index' : 'noindex'}, ${
      robots.follow ? 'follow' : 'nofollow'
    }`;

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Robots-Tag': robotsHeaderValue,
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('seo'),
      },
    });
  } catch (error) {
    reqLogger.error('SEO API error', normalizeError(error));
    return createErrorResponse(error, {
      route: '/api/seo',
      operation: 'SeoAPI',
      method: 'GET',
    });
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getOnlyCorsHeaders,
    },
  });
}
