/**
 * Enhanced API Route Factory
 * 
 * Creates standardized Next.js API route handlers with:
 * - Automatic Zod validation (query params + request body)
 * - Request-scoped logging
 * - Consistent error handling
 * - CORS headers
 * - OPTIONS handler generation
 * - Type-safe handlers
 * - OpenAPI-ready metadata
 * 
 * This factory eliminates ~30-40 lines of boilerplate per route handler
 * and enforces best practices across all API routes.
 * 
 * **OpenAPI Documentation:**
 * All routes using this factory are ready for OpenAPI generation:
 * - Zod schemas with `.describe()` are automatically converted to OpenAPI schemas
 * - OpenAPI metadata (summary, description, tags) can be provided in config
 * - Response schemas can be specified for documentation
 * - Future: Automatic OpenAPI spec generation from route configs
 * 
 * @module web-runtime/api/route-factory
 * 
 * @example
 * ```ts
 * // Simple GET route
 * export const GET = createApiRoute({
 *   route: '/api/status',
 *   operation: 'StatusAPI',
 *   method: 'GET',
 *   cors: 'anon',
 *   handler: async ({ logger }) => {
 *     const data = await getCachedApiHealthFormatted();
 *     return jsonResponse(data, 200, getOnlyCorsHeaders, buildCacheHeaders('status'));
 *   },
 * });
 * 
 * @example
 * ```ts
 * // GET route with query validation
 * export const GET = createApiRoute({
 *   route: '/api/company',
 *   operation: 'CompanyAPI',
 *   method: 'GET',
 *   cors: 'anon',
 *   querySchema: z.object({
 *     slug: slugSchema,
 *   }),
 *   handler: async ({ query, logger }) => {
 *     const profile = await getCachedCompanyProfile(query.slug);
 *     if (!profile) {
 *       return notFoundResponse('Company not found', 'Company');
 *     }
 *     return jsonResponse(profile, 200, getOnlyCorsHeaders, buildCacheHeaders('company_profile'));
 *   },
 * });
 * 
 * @example
 * ```ts
 * // POST route with body validation and OpenAPI metadata
 * export const POST = createApiRoute({
 *   route: '/api/changelog/sync',
 *   operation: 'ChangelogSyncAPI',
 *   method: 'POST',
 *   cors: 'auth',
 *   bodySchema: changelogSyncRequestSchema,
 *   openapi: {
 *     summary: 'Sync changelog entry',
 *     description: 'Syncs a changelog entry from CHANGELOG.md to database',
 *     tags: ['changelog', 'automation'],
 *     operationId: 'syncChangelogEntry',
 *   },
 *   handler: async ({ body, logger }) => {
 *     const result = await syncChangelogEntry(body);
 *     return jsonResponse({ success: true, id: result.id }, 200, postCorsHeaders);
 *   },
 * });
 * ```
 */

import 'server-only';

import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

import { logger, createErrorResponse, normalizeError } from '../logging/server';
import { getAuthenticatedUser } from '../auth/get-authenticated-user';
import {
  getOnlyCorsHeaders,
  getWithAuthCorsHeaders,
  postCorsHeaders,
  badRequestResponse,
  handleOptionsRequest,
  unauthorizedResponse,
} from '../server/api-helpers';

// =============================================================================
// Types
// =============================================================================

/**
 * CORS configuration type
 */
export type CorsConfig = 'anon' | 'auth' | 'post' | 'none';

/**
 * Route handler context provided to handlers
 */
export interface RouteHandlerContext<TQuery = unknown, TBody = unknown> {
  /** Scoped logger with request context */
  logger: ReturnType<typeof logger.child>;
  /** The original Next.js request */
  request: NextRequest;
  /** Parsed and validated query parameters */
  query: TQuery;
  /** Parsed and validated request body (for POST/PUT) */
  body: TBody;
  /** URL parsed from the request */
  url: URL;
  /** HTTP method */
  method: string;
  /** CORS headers based on config */
  cors: Record<string, string>;
  /** Next.js route context (for dynamic routes, Inngest, etc.) */
  nextContext?: unknown;
  /** Authenticated user (if available) - null if not authenticated, undefined if auth not checked */
  user?: User | null;
}

/**
 * Route handler function signature
 * 
 * Note: Handlers can return either NextResponse or Response to support
 * delegation to external handlers (e.g., Inngest, Flux router).
 */
export type RouteHandler<TQuery = unknown, TBody = unknown> = (
  ctx: RouteHandlerContext<TQuery, TBody>
) => Promise<NextResponse | Response>;

/**
 * OpenAPI metadata for route documentation
 */
export interface OpenAPIMetadata {
  /** Short summary of the endpoint */
  summary?: string;
  /** Detailed description of what the endpoint does */
  description?: string;
  /** Tags for grouping endpoints in OpenAPI docs */
  tags?: string[];
  /** Operation ID (unique identifier for this operation) */
  operationId?: string;
  /** Example responses (status code -> description) */
  responses?: Record<number, { description: string; schema?: z.ZodSchema }>;
  /** Whether this endpoint is deprecated */
  deprecated?: boolean;
}

/**
 * Configuration for creating an API route
 */
export interface ApiRouteConfig<TQuery = unknown, TBody = unknown> {
  /** Route path for logging (e.g., '/api/status') */
  route: string;
  /** Operation name for logging (e.g., 'StatusAPI') */
  operation: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** CORS configuration */
  cors?: CorsConfig;
  /** Zod schema for query parameter validation */
  querySchema?: z.ZodSchema<TQuery>;
  /** Zod schema for request body validation */
  bodySchema?: z.ZodSchema<TBody>;
  /** Route handler function */
  handler: RouteHandler<TQuery, TBody>;
  /** Optional: Custom error handler (overrides default) */
  onError?: (error: unknown, ctx: { route: string; operation: string; method: string }) => NextResponse;
  /** Optional: OpenAPI metadata for documentation generation */
  openapi?: OpenAPIMetadata;
  /** Optional: Require authentication (returns 401 if not authenticated) */
  requireAuth?: boolean;
  /** Optional: Check authentication but don't require it (user will be null if not authenticated) */
  optionalAuth?: boolean;
  /** Optional: Authentication info for user-facing protected endpoints (login/signup URLs) */
  authInfo?: {
    loginUrl?: string;
    signupUrl?: string;
    message?: string;
  };
}

// =============================================================================
// Factory Implementation
// =============================================================================

/**
 * Get CORS headers based on configuration
 */
function getCorsHeaders(config: CorsConfig): Record<string, string> {
  switch (config) {
    case 'anon':
      return getOnlyCorsHeaders;
    case 'auth':
      return getWithAuthCorsHeaders;
    case 'post':
      return postCorsHeaders;
    case 'none':
      return {};
    default:
      return getOnlyCorsHeaders;
  }
}

/**
 * Parse query parameters from URL
 */
function parseQueryParams<T>(url: URL, schema?: z.ZodSchema<T>): { data?: T; error?: NextResponse } {
  if (!schema) {
    return { data: undefined as T };
  }

  // Convert URLSearchParams to plain object
  const params: Record<string, string | string[]> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (params[key]) {
      // Handle multiple values (convert to array)
      const existing = params[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        params[key] = [existing, value];
      }
    } else {
      params[key] = value;
    }
  }

  // Validate with Zod schema
  const result = schema.safeParse(params);
  if (!result.success) {
    const errorMessages = result.error.issues.map((issue) => issue.message).join(', ');
    return {
      error: badRequestResponse(`Invalid query parameters: ${errorMessages}`, getOnlyCorsHeaders),
    };
  }

  return { data: result.data };
}

/**
 * Parse request body
 */
async function parseRequestBody<T>(
  request: NextRequest,
  schema?: z.ZodSchema<T>
): Promise<{ data?: T; error?: NextResponse }> {
  if (!schema) {
    return { data: undefined as T };
  }

  // Only parse body for POST/PUT/DELETE
  if (!['POST', 'PUT', 'DELETE'].includes(request.method)) {
    return { data: undefined as T };
  }

  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => issue.message).join(', ');
      return {
        error: badRequestResponse(`Invalid request body: ${errorMessages}`, getOnlyCorsHeaders),
      };
    }
    return { data: result.data };
  } catch (error) {
    // Error is already handled by badRequestResponse - no need to normalize
    return {
      error: badRequestResponse('Invalid JSON in request body', getOnlyCorsHeaders),
    };
  }
}

/**
 * Creates a standardized API route handler with automatic validation and error handling
 * 
 * @param config - Route configuration
 * @returns Next.js route handler function
 */
export function createApiRoute<TQuery = unknown, TBody = unknown>(
  config: ApiRouteConfig<TQuery, TBody>
): (request: NextRequest, context?: unknown) => Promise<NextResponse> {
  const {
    route,
    operation,
    method,
    cors = 'anon',
    querySchema,
    bodySchema,
    handler,
    onError,
    requireAuth,
    optionalAuth,
    authInfo,
  } = config;
  const corsHeaders = getCorsHeaders(cors);

  return async (request: NextRequest, context?: unknown): Promise<NextResponse> => {
    // Create request-scoped logger
    const reqLogger = logger.child({
      operation,
      route,
      method,
    });

    // Validate HTTP method
    if (request.method !== method && request.method !== 'OPTIONS') {
      reqLogger.warn({ requestedMethod: request.method }, 'Method not allowed');
      return NextResponse.json(
        { error: 'Method not allowed', allowed: method },
        {
          status: 405,
          headers: {
            Allow: method,
            ...corsHeaders,
          },
        }
      );
    }

    // Handle OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return handleOptionsRequest(corsHeaders);
    }

    try {
      // Check authentication if required or optional
      let user: User | null | undefined = undefined;
      if (requireAuth || optionalAuth) {
        try {
          const authResult = await getAuthenticatedUser({
            requireUser: requireAuth ?? false,
            context: operation,
          });

          if (requireAuth && !authResult.user) {
            reqLogger.warn({}, 'Authentication required but user not authenticated');
            return unauthorizedResponse(
              'Authentication required',
              authInfo,
              corsHeaders
            );
          }

          user = authResult.user ?? null;
        } catch (error) {
          // If requireAuth is true, getAuthenticatedUser throws when user is missing
          // This means authentication failed
          if (requireAuth) {
            reqLogger.warn({ err: normalizeError(error) }, 'Authentication failed');
            return unauthorizedResponse(
              'Authentication required',
              authInfo,
              corsHeaders
            );
          }
          // For optionalAuth, just set user to null
          user = null;
        }
      }

      // Parse and validate query parameters
      const queryResult = parseQueryParams(request.nextUrl, querySchema);
      if (queryResult.error) {
        reqLogger.warn({}, 'Query parameter validation failed');
        return queryResult.error;
      }

      // Parse and validate request body
      const bodyResult = await parseRequestBody(request, bodySchema);
      if (bodyResult.error) {
        reqLogger.warn({}, 'Request body validation failed');
        return bodyResult.error;
      }

      // Create handler context
      const ctx: RouteHandlerContext<TQuery, TBody> = {
        logger: reqLogger,
        request,
        query: queryResult.data as TQuery,
        body: bodyResult.data as TBody,
        url: request.nextUrl,
        method: request.method,
        cors: corsHeaders,
        nextContext: context,
        ...(user !== undefined && { user }),
      };

      // Execute handler
      const response = await handler(ctx);
      // Ensure we return NextResponse (convert Response if needed)
      if (response instanceof NextResponse) {
        return response;
      }
      // Convert Response to NextResponse for consistency
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (error) {
      // Use custom error handler if provided
      if (onError) {
        return onError(error, { route, operation, method });
      }

      // Default error handling
      reqLogger.error({ err: normalizeError(error) }, `${operation} failed`);
      return createErrorResponse(error, {
        route,
        operation,
        method,
      });
    }
  };
}

/**
 * Creates a standardized OPTIONS handler for CORS preflight requests
 * 
 * @param cors - CORS configuration
 * @returns Next.js OPTIONS handler
 * 
 * @example
 * ```ts
 * export const OPTIONS = createOptionsHandler('anon');
 * ```
 */
export function createOptionsHandler(cors: CorsConfig = 'anon'): () => NextResponse {
  const corsHeaders = getCorsHeaders(cors);
  return () => handleOptionsRequest(corsHeaders);
}
