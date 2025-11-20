/// <reference path="../_shared/deno-globals.d.ts" />

/**
 * OG Image Generator Edge Function
 * Generates dynamic Open Graph images for any route using metadata from data-api/seo
 *
 * Design matches static og-image.webp:
 * - Dark background (#1a1410) with subtle dot pattern
 * - Pill-style category badge (not rounded rectangle)
 * - Large white title (72px, bold) - MUST display
 * - Gray description (32px) below title
 * - Tags as orange pills (max 5)
 * - "heyclaude" logo (hey + claude chip) at bottom left
 * - Clean domain text at bottom right
 * - Dimensions: 1200x630 (standard OG image size)
 */

import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts';
import React from 'https://esm.sh/react@18.2.0';
import { SITE_URL } from '../_shared/clients/supabase.ts';
import { edgeEnv } from '../_shared/config/env.ts';
import type { Database as DatabaseGenerated } from '../_shared/database.types.ts';
import { callRpc } from '../_shared/database-overrides.ts';

// Content category validation
const CONTENT_CATEGORY_VALUES = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
  'jobs',
  'changelog',
] as const satisfies readonly DatabaseGenerated['public']['Enums']['content_category'][];

function isValidContentCategory(
  value: string
): value is DatabaseGenerated['public']['Enums']['content_category'] {
  return CONTENT_CATEGORY_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['content_category']
  );
}

import { CIRCUIT_BREAKER_CONFIGS, withCircuitBreaker } from '../_shared/utils/circuit-breaker.ts';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  jsonResponse,
} from '../_shared/utils/http.ts';
import { sanitizeRoute, validateQueryString } from '../_shared/utils/input-validation.ts';
import {
  type BaseLogContext,
  logError,
  logInfo,
  logWarn,
  withDuration,
} from '../_shared/utils/logging.ts';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '../_shared/utils/rate-limit.ts';
import {
  applyRateLimitHeaders,
  createRateLimitErrorResponse,
} from '../_shared/utils/rate-limit-middleware.ts';
import { createRouter, type HttpMethod, type RouterContext } from '../_shared/utils/router.ts';
import { buildSecurityHeaders } from '../_shared/utils/security-headers.ts';
import { TIMEOUT_PRESETS, withTimeout } from '../_shared/utils/timeout.ts';

const CORS = getOnlyCorsHeaders;
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

interface OGImageParams {
  title: string;
  description: string;
  type: string;
  tags: string[];
}

interface OGImageContext extends RouterContext {
  startTime: number;
}

/**
 * Create OG image specific log context (more specific than shared-utils)
 */
function createOGImageContext(action: string, options?: Record<string, unknown>): BaseLogContext {
  return {
    function: 'og-image',
    action,
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...options,
  };
}

/**
 * Fetch metadata from data-api/seo endpoint with circuit breaker and timeout
 * Falls back to route-based title extraction if SEO API fails
 */
async function fetchMetadataFromRoute(
  route: string,
  logContext: BaseLogContext
): Promise<OGImageParams | null> {
  const supabaseUrl = edgeEnv.supabase.url;
  const seoUrl = `${supabaseUrl}/functions/v1/data-api/seo?route=${encodeURIComponent(route)}&include=metadata`;

  try {
    const fetchMetadata = async () => {
      const response = await fetch(seoUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`SEO API returned ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as
        | {
            metadata?: {
              title?: string;
              description?: string;
              keywords?: string[];
            };
          }
        | { title?: string; description?: string; keywords?: string[] };

      // Extract metadata from response
      // Response can be either { title, description, ... } or { metadata: { title, description, ... } }
      const metadata = ('metadata' in data ? data.metadata : data) as {
        title?: string;
        description?: string;
        keywords?: string[];
      };

      if (!metadata?.title) {
        throw new Error('Metadata missing title');
      }

      return {
        title: metadata.title || 'Claude Pro Directory',
        description: metadata.description || 'Community-curated agents, MCPs, and rules',
        type: extractTypeFromRoute(route) || 'agents',
        tags: Array.isArray(metadata.keywords) ? metadata.keywords : [],
      };
    };

    // Wrap with circuit breaker and timeout
    const metadata = await withTimeout(
      withCircuitBreaker('og-image:seo-api', fetchMetadata, CIRCUIT_BREAKER_CONFIGS.external),
      TIMEOUT_PRESETS.external,
      'SEO API call timed out'
    );

    return metadata;
  } catch (error) {
    logWarn('SEO API fetch failed, attempting direct database fallback', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
      seoUrl,
    });

    // Fallback 1: Try direct database query for content routes
    const type = extractTypeFromRoute(route);
    if (type && type !== 'website' && route.includes('/') && isValidContentCategory(type)) {
      // Type guard narrows type to ENUM - database will validate
      const slug = route.split('/').pop() || '';
      if (slug) {
        try {
          // Try to get content directly from database
          // Database validates ENUM - no type assertion needed after type guard
          const rpcArgs = {
            p_category: type, // Type guard has narrowed this to ENUM
            p_slug: slug,
            p_base_url: SITE_URL,
          } satisfies DatabaseGenerated['public']['Functions']['get_api_content_full']['Args'];
          const { data: contentData, error: dbError } = await callRpc(
            'get_api_content_full',
            rpcArgs,
            true
          );

          if (
            !dbError &&
            contentData &&
            typeof contentData === 'object' &&
            'title' in contentData
          ) {
            const content = contentData as {
              title: string;
              description?: string;
              tags?: string[];
            };
            logInfo('Direct database fallback succeeded', {
              ...logContext,
              source: 'database-rpc',
            });
            return {
              title: content.title || 'Claude Pro Directory',
              description: content.description || 'Community-curated agents, MCPs, and rules',
              type: type || 'agents',
              tags: Array.isArray(content.tags) ? content.tags : [],
            };
          }
        } catch (dbError) {
          logWarn('Direct database fallback also failed, using route-based extraction', {
            ...logContext,
            dbError: dbError instanceof Error ? dbError.message : String(dbError),
          });
        }
      }
    }

    // Fallback 2: Extract basic info from route (last resort)
    const slug = route.split('/').pop() || '';
    const title =
      slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') || 'Claude Pro Directory';

    return {
      title,
      description: 'Community-curated agents, MCPs, and rules',
      type: type || 'agents',
      tags: [],
    };
  }
}

/**
 * Extract category/type from route path
 */
function extractTypeFromRoute(route: string): string {
  // Routes like /agents/code-reviewer -> "agents"
  // Routes like /mcp/github -> "mcp"
  // Routes like / -> "website"
  if (route === '/' || route === '') {
    return 'website';
  }
  const match = route.match(/^\/([^/]+)/);
  return match?.[1] ?? 'agents';
}

/**
 * Generate heyclaude logo component (hey + claude chip style)
 */
function createHeyClaudeLogo(size: 'sm' | 'md' | 'lg' = 'md') {
  const fontSize = size === 'sm' ? '28px' : size === 'md' ? '36px' : '44px';

  return React.createElement(
    'div',
    {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        fontSize,
        color: '#E9EBE6',
        textTransform: 'lowercase',
      },
    },
    React.createElement('span', { style: { color: '#E9EBE6' } }, 'hey'),
    React.createElement(
      'span',
      {
        style: {
          backgroundColor: '#FF6F4A',
          color: '#1A1B17',
          borderRadius: '9999px',
          padding: '4px 14px',
          fontWeight: 800,
          lineHeight: 1.2,
        },
      },
      'claude'
    )
  );
}

/**
 * Generate OG image using React and og_edge
 * Redesigned to match static og-image.webp style
 */
function generateOGImage(params: OGImageParams): Response {
  const { title, description, type, tags } = params;

  return new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#1a1410',
          backgroundImage:
            'radial-gradient(circle at 25px 25px, #2a2010 2%, transparent 0%), radial-gradient(circle at 75px 75px, #2a2010 2%, transparent 0%)',
          backgroundSize: '100px 100px',
          padding: '60px',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            width: '100%',
          },
        },
        // Category badge - pill style (not rounded rectangle)
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
          React.createElement(
            'div',
            {
              style: {
                backgroundColor: '#FF6F4A',
                color: '#1A1B17',
                padding: '6px 18px',
                borderRadius: '9999px', // Full pill shape
                fontSize: '20px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              },
            },
            type
          )
        ),
        // Title - MUST be visible
        React.createElement(
          'h1',
          {
            style: {
              fontSize: '72px',
              fontWeight: '800',
              color: '#ffffff',
              lineHeight: '1.1',
              margin: '0',
              maxWidth: '1000px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            },
          },
          title
        ),
        // Description
        description &&
          React.createElement(
            'p',
            {
              style: {
                fontSize: '32px',
                color: '#9ca3af',
                lineHeight: '1.4',
                margin: '0',
                maxWidth: '900px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              },
            },
            description
          ),
        // Tags
        tags.length > 0 &&
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                marginTop: '8px',
              },
            },
            ...tags.slice(0, 5).map((tag) =>
              React.createElement(
                'div',
                {
                  key: tag,
                  style: {
                    backgroundColor: '#2a2010',
                    color: '#FF6F4A',
                    padding: '4px 14px',
                    borderRadius: '9999px',
                    fontSize: '18px',
                    fontWeight: '600',
                    border: '1px solid #3a3020',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                tag
              )
            )
          )
      ),
      // Bottom section
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 'auto',
          },
        },
        // HeyClaude logo (left)
        createHeyClaudeLogo('md'),
        // Domain (right) - cleaner styling
        React.createElement(
          'div',
          {
            style: {
              fontSize: '22px',
              color: '#6b7280',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 500,
              letterSpacing: '0.01em',
            },
          },
          'claudepro.directory'
        )
      )
    ),
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
    }
  );
}

/**
 * Handle OG image generation request
 */
async function handleOGImageRequest(ctx: OGImageContext): Promise<Response> {
  const url = ctx.url;
  const routeParam = url.searchParams.get('route');
  const titleParam = url.searchParams.get('title');
  const descriptionParam = url.searchParams.get('description');
  const typeParam = url.searchParams.get('type');
  const tagsParam = url.searchParams.get('tags');

  const logContext = createOGImageContext('generate', {
    route: routeParam || 'direct-params',
  });

  let params: OGImageParams;

  // Route-based generation (preferred)
  if (routeParam) {
    const sanitizedRoute = sanitizeRoute(routeParam);
    const metadata = await fetchMetadataFromRoute(sanitizedRoute, logContext);

    if (metadata) {
      params = metadata;
    } else {
      logError('Failed to fetch metadata for route, using minimal fallback', logContext);
      // Minimal fallback - at least show something
      const type = extractTypeFromRoute(sanitizedRoute);
      const slug = sanitizedRoute.split('/').pop() || '';
      const fallbackTitle =
        slug
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') || 'Claude Pro Directory';

      params = {
        title: fallbackTitle,
        description: 'Community-curated agents, MCPs, and rules',
        type: type || 'agents',
        tags: [],
      };
    }
  }
  // Direct params (fallback)
  else if (titleParam || descriptionParam || typeParam || tagsParam) {
    params = {
      title: titleParam || 'Claude Pro Directory',
      description: descriptionParam || 'Community-curated agents, MCPs, and rules',
      type: typeParam || 'agents',
      tags: tagsParam
        ? tagsParam
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    };
  } else {
    return badRequestResponse(
      'Missing required parameter: route or title. Example: ?route=/agents/some-slug or ?title=My Title&description=My Description',
      CORS
    );
  }

  // Ensure title is never empty
  if (!params.title || params.title.trim() === '') {
    params.title = 'Claude Pro Directory';
  }

  try {
    const imageResponse = generateOGImage(params);
    logInfo('OG image generated', {
      ...withDuration(logContext, ctx.startTime),
      title: params.title,
      type: params.type,
      tagsCount: params.tags.length,
    });

    // Add cache and security headers to the image response
    const headers = new Headers(imageResponse.headers);
    headers.set('Content-Type', 'image/png');
    headers.set('X-Generated-By', 'og-image-edge-function');
    for (const [key, value] of Object.entries(buildSecurityHeaders())) {
      headers.set(key, value);
    }
    // Long-term caching: OG images rarely change (30 days TTL, 90 days stale-while-revalidate)
    // Content pages rarely update, so we can cache aggressively
    const cacheTtl = 60 * 60 * 24 * 30; // 30 days
    const cacheStale = 60 * 60 * 24 * 90; // 90 days
    for (const [key, value] of Object.entries(
      buildCacheHeaders('seo', { ttl: cacheTtl, stale: cacheStale })
    )) {
      headers.set(key, value);
    }
    for (const [key, value] of Object.entries(CORS)) {
      headers.set(key, value);
    }

    return new Response(imageResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    logError('Failed to generate OG image', logContext, error);
    return errorResponse(error, 'og-image:generate', CORS);
  }
}

/**
 * Analytics wrapper for OG image generation
 */
function respondWithAnalytics(
  ctx: OGImageContext,
  handler: () => Promise<Response>
): Promise<Response> {
  const startedAt = performance.now();
  const logContext = createOGImageContext('request', {
    method: ctx.method,
    path: ctx.url.pathname,
  });

  const logEvent = (status: number, outcome: 'success' | 'error', error?: unknown) => {
    const durationMs = Math.round(performance.now() - startedAt);
    const logData: Record<string, unknown> = {
      method: ctx.method,
      status,
      duration_ms: durationMs,
    };

    const query = ctx.url.searchParams.toString();
    if (query) {
      logData['query'] = query;
    }
    if (error) {
      logData['error'] = error instanceof Error ? error.message : String(error);
    }

    if (outcome === 'success') {
      logInfo('OG image request completed', { ...logContext, ...logData });
    } else {
      logError('OG image request failed', { ...logContext, ...logData }, error);
    }
  };

  return handler()
    .then((response) => {
      logEvent(response.status, 'success');
      return response;
    })
    .catch((error) => {
      const status =
        error instanceof Response
          ? error.status
          : typeof error === 'object' && error !== null && 'status' in error
            ? Number((error as { status?: number }).status) || 500
            : 500;
      logEvent(status, 'error', error);
      throw error;
    });
}

const router = createRouter<OGImageContext>({
  buildContext: (request) => {
    const url = new URL(request.url);
    const originalMethod = request.method.toUpperCase() as HttpMethod;
    const normalizedMethod = (originalMethod === 'HEAD' ? 'GET' : originalMethod) as HttpMethod;

    // Input validation
    const queryValidation = validateQueryString(url);
    if (!queryValidation.valid) {
      throw new Error(queryValidation.error);
    }

    return {
      request,
      url,
      method: normalizedMethod,
      originalMethod,
      startTime: performance.now(),
    };
  },
  defaultCors: CORS,
  onNoMatch: (ctx) => {
    const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.public);
    if (!rateLimit.allowed) {
      return createRateLimitErrorResponse(rateLimit, {
        preset: 'public',
        cors: CORS,
        errorResponseType: 'badRequest',
      });
    }
    return respondWithAnalytics(ctx, () => handleOGImageRequest(ctx)).then((response) => {
      applyRateLimitHeaders(response, rateLimit, 'public');
      return response;
    });
  },
  routes: [
    {
      name: 'og-image',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      match: () => true, // Match all GET requests
      handler: async (ctx) => {
        const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.public);
        if (!rateLimit.allowed) {
          return createRateLimitErrorResponse(rateLimit, {
            preset: 'public',
            cors: CORS,
            errorResponseType: 'badRequest',
          });
        }
        const response = await respondWithAnalytics(ctx, () => handleOGImageRequest(ctx));
        applyRateLimitHeaders(response, rateLimit, 'public');
        return response;
      },
    },
  ],
});

Deno.serve(async (request: Request) => {
  try {
    return await router(request);
  } catch (error) {
    // Handle validation errors from buildContext
    if (
      error instanceof Error &&
      (error.message.includes('too long') || error.message.includes('invalid'))
    ) {
      return jsonResponse(
        {
          error: 'Bad Request',
          message: error.message,
        },
        400,
        CORS
      );
    }

    // Re-throw to let router handle it
    throw error;
  }
});
