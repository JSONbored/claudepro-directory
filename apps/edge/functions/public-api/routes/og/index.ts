/// <reference path="@heyclaude/edge-runtime/deno-globals.d.ts" />

/**
 * OG Image Generator Handler
 * Generates dynamic Open Graph images for any route using metadata from data-api/seo
 */

import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts';
import React from 'npm:react@18.3.1';
import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import {
  badRequestResponse,
  buildCacheHeaders,
  edgeEnv,
  errorResponse,
  getOnlyCorsHeaders,
  initRequestLogging,
  SITE_URL,
  supabaseAnon,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import {
  buildSecurityHeaders,
  CIRCUIT_BREAKER_CONFIGS,
  deriveTitleFromRoute,
  errorToString,
  logError,
  logInfo,
  logWarn,
  logger,
  OG_DEFAULTS,
  sanitizeRoute,
  TIMEOUT_PRESETS,
  validateQueryString,
  withCircuitBreaker,
  withTimeout,
} from '@heyclaude/shared-runtime';
import { getSeoMetadata } from '../../lib/seo.ts';

const CORS = getOnlyCorsHeaders;
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// Use enum values directly from @heyclaude/database-types Constants
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

/**
 * Determines whether a string is one of the recognized content category values.
 *
 * @param value - The candidate content category to validate
 * @returns `true` if `value` matches a known content category, `false` otherwise
 */
function isValidContentCategory(
  value: string
): value is DatabaseGenerated['public']['Enums']['content_category'] {
  // Check each valid value explicitly to avoid type assertion
  for (const validValue of CONTENT_CATEGORY_VALUES) {
    if (value === validValue) {
      return true;
    }
  }
  return false;
}

export interface OGImageParams {
  title: string;
  description: string;
  type: string;
  tags: string[];
}

/**
 * Create a per-request logging context for OG image generation.
 *
 * @param action - Short label describing the action or step being performed
 * @param options - Additional context properties to merge into the returned object
 * @returns An object containing `function: 'og-image'`, the provided `action`, a generated `request_id` (UUID), an ISO `started_at` timestamp, and any supplied `options`
 */
function createOGImageContext(action: string, options?: Record<string, unknown>): Record<string, unknown> {
  return {
    function: 'og-image',
    action,
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...options,
  };
}

/**
 * Normalize SEO metadata from an HTTP response into an object with `title`, `description`, and `keywords` when present.
 *
 * Accepts responses shaped either as `{ metadata: { ... } }` or as a top-level metadata object and extracts only
 * string `title` and `description` and an array of string `keywords`. Only valid fields are included in the result.
 *
 * @returns An object containing any of `title`, `description`, and `keywords` (array of strings) when those fields exist and are of the expected types.
 */
function extractMetadataFromResponse(data: unknown): {
  title?: string;
  description?: string;
  keywords?: string[];
} {
  if (typeof data !== 'object' || data === null) {
    return {};
  }

  const getStringProperty = (obj: object, key: string): string | undefined => {
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc && typeof desc.value === 'string' ? desc.value : undefined;
  };

  const getArrayProperty = (obj: object, key: string): unknown[] | undefined => {
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc && Array.isArray(desc.value) ? desc.value : undefined;
  };

  // Handle both { metadata: {...} } and {...} shapes
  const source =
    'metadata' in data && typeof data.metadata === 'object' && data.metadata !== null
      ? data.metadata
      : data;

  const metadata: { title?: string; description?: string; keywords?: string[] } = {};
  const title = getStringProperty(source, 'title');
  const description = getStringProperty(source, 'description');
  const keywordsArray = getArrayProperty(source, 'keywords');
  const keywords = keywordsArray?.filter((k): k is string => typeof k === 'string');

  if (title !== undefined) metadata.title = title;
  if (description !== undefined) metadata.description = description;
  if (keywords !== undefined) metadata.keywords = keywords;

  return metadata;
}

/**
 * Resolve Open Graph metadata for a given URL route using layered fallbacks.
 *
 * Attempts to obtain title, description, type, and tags from primary SEO generation, then an internal SEO HTTP endpoint, then a database RPC for content routes, and finally derives a title from the route when other methods fail. Returned values use sensible defaults when specific metadata is unavailable.
 *
 * @param route - The URL path to resolve metadata for (for example, `/agents/foo`)
 * @param logContext - Per-request logging context used for observability and logging
 * @returns OGImageParams containing `title`, `description`, `type`, and `tags`; `title` and `description` will fall back to defaults when not available, and `tags` will be an empty array if none are found
 */
async function fetchMetadataFromRoute(
  route: string,
  logContext: Record<string, unknown>
): Promise<OGImageParams> {
  const supabaseUrl = edgeEnv.supabase.url;
  // Compute route type upfront to reuse across all return paths
  const routeType = extractTypeFromRoute(route);

  // Try direct function call first (avoids HTTP loopback and reduces latency)
  try {
    const fetchMetadataDirect = async () => {
      const result = await getSeoMetadata(route, supabaseAnon, 'metadata');
      if (!result) {
        throw new Error('SEO metadata generation returned null');
      }
      return {
        title: result.title || OG_DEFAULTS.title,
        description: result.description || OG_DEFAULTS.description,
        type: routeType || OG_DEFAULTS.type,
        tags: Array.isArray(result.keywords) ? result.keywords : [],
      };
    };

    // Wrap with circuit breaker and timeout
    const metadata = await withTimeout(
      withCircuitBreaker('og-image:seo-direct', fetchMetadataDirect, CIRCUIT_BREAKER_CONFIGS.rpc),
      TIMEOUT_PRESETS.rpc,
      'SEO direct call timed out'
    );

    logInfo('SEO metadata fetched via direct call', {
      ...logContext,
      source: 'direct-function',
    });

    return metadata;
  } catch (error) {
    logWarn('Direct SEO metadata call failed, attempting HTTP fallback', {
      ...logContext,
      error: errorToString(error),
    });

    // Fallback to HTTP call (with loopback detection guard)
    const seoUrl = `${supabaseUrl}/functions/v1/public-api/seo?route=${encodeURIComponent(route)}&include=metadata`;

    try {
      const fetchMetadataHttp = async () => {
        // Loopback detection: X-Internal-Loopback header is set to prevent circular calls
        // The SEO route handler will detect this header and log a warning
        const response = await fetch(seoUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Loopback': 'true', // Mark as internal call to prevent circular calls
          },
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`SEO API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        // Extract metadata from response
        const metadata = extractMetadataFromResponse(data);

        if (!metadata.title) {
          throw new Error('Metadata missing title');
        }

        return {
          title: metadata.title,
          description: metadata.description || OG_DEFAULTS.description,
          type: routeType || OG_DEFAULTS.type,
          tags: Array.isArray(metadata.keywords) ? metadata.keywords : [],
        };
      };

      // Wrap with circuit breaker and timeout
      const metadata = await withTimeout(
        withCircuitBreaker('og-image:seo-api', fetchMetadataHttp, CIRCUIT_BREAKER_CONFIGS.external),
        TIMEOUT_PRESETS.external,
        'SEO API call timed out'
      );

      logInfo('SEO metadata fetched via HTTP fallback', {
        ...logContext,
        source: 'http-fallback',
      });

      return metadata;
    } catch (httpError) {
      logWarn('HTTP fallback also failed, attempting direct database fallback', {
        ...logContext,
        error: errorToString(httpError),
        seoUrl,
      });

      // Fallback 1: Try direct database query for content routes
      if (
        routeType &&
        routeType !== 'website' &&
        route.includes('/') &&
        isValidContentCategory(routeType)
      ) {
        // Type guard narrows type to ENUM - database will validate
        // Use filter(Boolean) to handle trailing slashes (e.g., /agents/foo/ -> 'foo')
        const slug = route.split('/').filter(Boolean).pop() || '';
        if (slug) {
          // Try to get content directly from database
          // Database validates ENUM - no type assertion needed after type guard
          const rpcArgs = {
            p_category: routeType, // Type guard has narrowed this to ENUM
            p_slug: slug,
            p_base_url: SITE_URL,
          } satisfies DatabaseGenerated['public']['Functions']['get_api_content_full']['Args'];
          try {
            const { data: contentData, error: dbError } = await withTimeout(
              withCircuitBreaker(
                'og-image:fetch-content',
                async () => await supabaseAnon.rpc('get_api_content_full', rpcArgs),
                CIRCUIT_BREAKER_CONFIGS.rpc
              ),
              TIMEOUT_PRESETS.rpc,
              'Database RPC timed out'
            );

            // get_api_content_full returns a JSON string, not an object
            if (dbError) {
              // Use dbQuery serializer for consistent database query formatting
              logWarn('RPC call failed in fetchMetadataFromRoute', {
                ...logContext,
                dbQuery: {
                  rpcName: 'get_api_content_full',
                  args: rpcArgs, // Will be redacted by Pino's redact config
                },
              }, dbError);
            }
            
            if (!dbError && contentData && typeof contentData === 'string') {
              try {
                const parsedContent = JSON.parse(contentData);
                // Validate structure without type assertions
                if (
                  typeof parsedContent === 'object' &&
                  parsedContent !== null &&
                  'title' in parsedContent &&
                  typeof parsedContent.title === 'string'
                ) {
                  const title = parsedContent.title;
                  const description =
                    'description' in parsedContent && typeof parsedContent.description === 'string'
                      ? parsedContent.description
                      : undefined;
                  const tags =
                    'tags' in parsedContent && Array.isArray(parsedContent.tags)
                      ? parsedContent.tags.filter(
                          (tag: unknown): tag is string => typeof tag === 'string'
                        )
                      : [];

                  logInfo('Direct database fallback succeeded', {
                    ...logContext,
                    source: 'database-rpc',
                  });
                  return {
                    title: title || OG_DEFAULTS.title,
                    description: description || OG_DEFAULTS.description,
                    type: routeType || OG_DEFAULTS.type,
                    tags,
                  };
                }
              } catch (parseError) {
                logWarn('Failed to parse content JSON from database', {
                  ...logContext,
                  parseError: parseError instanceof Error ? parseError.message : String(parseError),
                });
              }
            }
          } catch (dbError) {
            // Use dbQuery serializer for consistent database query formatting
            logWarn('Direct database fallback also failed, using route-based extraction', {
              ...logContext,
              dbQuery: {
                rpcName: 'get_api_content_full',
                args: rpcArgs, // Will be redacted by Pino's redact config
              },
            }, dbError);
          }
        }
      }

      // Fallback 2: Extract basic info from route (last resort)
      const title = deriveTitleFromRoute(route);

      return {
        title,
        description: OG_DEFAULTS.description,
        type: routeType || OG_DEFAULTS.type,
        tags: [],
      };
    }
  }
}

/**
 * Determine the content category implied by a URL path.
 *
 * @param route - The URL path (e.g., "/", "/agents/code-reviewer", "/mcp/github")
 * @returns The first path segment if it matches a known content category, otherwise "website"
 */
function extractTypeFromRoute(route: string): string {
  // Routes like /agents/code-reviewer -> "agents"
  // Routes like /mcp/github -> "mcp"
  // Routes like / -> "website"
  if (route === '/' || route === '') {
    return 'website';
  }
  const match = route.match(/^\/([^/]+)/);
  const extractedType = match?.[1] ?? 'website';
  // Validate against known content categories, default to 'website' if invalid
  return isValidContentCategory(extractedType) ? extractedType : 'website';
}

/**
 * Create a React element that renders the "HeyClaude" logo with a two-part "hey" text and a rounded "claude" pill.
 *
 * @param size - Visual size of the logo; `'sm'` | `'md'` | `'lg'` adjust the rendered font size
 * @returns A React element containing the styled HeyClaude logo
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
 * Creates an Open Graph PNG image suitable for use as a social preview based on provided OG image parameters.
 *
 * The generated image includes a category pill, prominent title, optional description, up to five tag pills,
 * and bottom-branding (logo and domain). Layout and styling are optimized for a consistent og-image appearance.
 *
 * @param params - OGImageParams with `title`, optional `description`, `type` (category), and `tags` array
 * @returns A Response containing the generated PNG image for use in Open Graph previews
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
            ...tags.slice(0, 5).map((tag, index) =>
              React.createElement(
                'div',
                {
                  key: `${tag}-${index}`,
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
 * Generates an Open Graph PNG image from a route or explicit metadata.
 *
 * @param req - Incoming Request whose URL query must supply either `route` or one or more of `title`, `description`, `type`, `tags`
 * @returns An HTTP Response with the generated PNG image and appropriate headers; returns a 400 response for missing or invalid parameters or an error response when image generation fails.
 */
export async function handleOGImageRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const routeParam = url.searchParams.get('route');
  const titleParam = url.searchParams.get('title');
  const descriptionParam = url.searchParams.get('description');
  const typeParam = url.searchParams.get('type');
  const tagsParam = url.searchParams.get('tags');

  const logContext = createOGImageContext('generate', {
    route: routeParam || 'direct-params',
  });
  
  // Initialize request logging with trace and bindings (Phase 1 & 2)
  initRequestLogging(logContext);
  traceStep('OG image generation request received', logContext);
  
  // Set bindings for this request - mixin will automatically inject these into all subsequent logs
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'og-image-generate',
    function: typeof logContext['function'] === "string" ? logContext['function'] : "unknown",
  });

  let params: OGImageParams;

  // Route-based generation (preferred)
  if (routeParam) {
    // Input validation
    const queryValidation = validateQueryString(url);
    if (!queryValidation.valid) {
      return badRequestResponse(queryValidation.error || 'Invalid query string', CORS);
    }

    const sanitizedRoute = sanitizeRoute(routeParam);
    // fetchMetadataFromRoute always returns OGImageParams (never null)
    params = await fetchMetadataFromRoute(sanitizedRoute, logContext);
  }
  // Direct params (fallback)
  else if (titleParam || descriptionParam || typeParam || tagsParam) {
    // Validate query string for consistency with route-based branch
    const queryValidation = validateQueryString(url);
    if (!queryValidation.valid) {
      return badRequestResponse(queryValidation.error || 'Invalid query string', CORS);
    }
    params = {
      title: titleParam || OG_DEFAULTS.title,
      description: descriptionParam || OG_DEFAULTS.description,
      type: typeParam || OG_DEFAULTS.type,
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
      ...logContext,
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
    // Note: Using 'seo' cache preset key with custom overrides (default 'seo' is 1d/2d, we use 30d/90d)
    // The preset key is used for observability; actual TTL values come from overrides
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

    traceRequestComplete(logContext);
    return new Response(imageResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    await logError('Failed to generate OG image', logContext, error);
    return await errorResponse(error, 'og-image:generate', CORS, logContext);
  }
}