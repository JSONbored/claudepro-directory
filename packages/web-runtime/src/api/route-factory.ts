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
 *     return jsonResponse(data, 200, getOnlyCorsHeaders);
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
 *     return jsonResponse(profile, 200, getOnlyCorsHeaders);
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
  /** Example responses (status code -> response config) */
  responses?: Record<
    number,
    {
      description: string;
      schema?: z.ZodSchema;
      /** Response headers documentation */
      headers?: Record<string, { schema: { type: string }; description: string }>;
      /** Example response value */
      example?: unknown;
    }
  >;
  /** Whether this endpoint is deprecated */
  deprecated?: boolean;
  /** Security requirements for this operation */
  security?: Array<Record<string, string[]>>;
  /** External documentation links */
  externalDocs?: { description: string; url: string };
  /** Request body documentation */
  requestBody?: {
    /** Description of the request body */
    description?: string;
    /** Whether the request body is required */
    required?: boolean;
  };
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
  onError?: (
    error: unknown,
    ctx: { route: string; operation: string; method: string }
  ) => NextResponse;
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
function parseQueryParams<T>(
  url: URL,
  schema?: z.ZodSchema<T>
): { data?: T; error?: NextResponse } {
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
            return unauthorizedResponse('Authentication required', authInfo, corsHeaders);
          }

          user = authResult.user ?? null;
        } catch (error) {
          // If requireAuth is true, getAuthenticatedUser throws when user is missing
          // This means authentication failed
          if (requireAuth) {
            reqLogger.warn({ err: normalizeError(error) }, 'Authentication failed');
            return unauthorizedResponse('Authentication required', authInfo, corsHeaders);
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

// =============================================================================
// Cached API Route Factory (with Service Integration)
// =============================================================================

import type { ServiceKey } from '../data/service-factory';
import { getService } from '../data/service-factory';
import { cacheLife, cacheTag } from 'next/cache';
import { jsonResponse } from '../server/api-helpers';

/**
 * Cache life profile options for cached API routes
 */
type CacheLifeProfile =
  | 'short'
  | 'medium'
  | 'long'
  | 'userProfile'
  | { expire: number; revalidate: number; stale: number };

/**
 * Service method configuration for cached API routes
 */
interface ServiceMethodConfig<TQuery = unknown, TBody = unknown> {
  /** Service key (e.g., 'content', 'trending') */
  serviceKey: ServiceKey;
  /** Service method name to call */
  methodName: string;
  /** Arguments to pass to the service method (function that receives query/body and optionally route params) */
  methodArgs: (query: TQuery, body: TBody, routeParams?: Record<string, string>) => unknown[];
  /** Optional function to extract route params from nextContext (for dynamic routes) */
  getRouteParams?: (
    nextContext: unknown
  ) => Promise<Record<string, string>> | Record<string, string>;
}

/**
 * Configuration for creating a cached API route with service integration
 *
 * Extends ApiRouteConfig with service and caching configuration.
 * Automatically handles service instantiation, caching, and common response patterns.
 */
export interface CachedApiRouteConfig<TQuery = unknown, TBody = unknown> extends Omit<
  ApiRouteConfig<TQuery, TBody>,
  'handler'
> {
  /** Cache life profile */
  cacheLife: CacheLifeProfile;
  /** Optional cache tags for invalidation */
  cacheTags?:
    | string[]
    | ((query: TQuery, body: TBody, routeParams?: Record<string, string>) => string[]);
  /** Service method configuration */
  service: ServiceMethodConfig<TQuery, TBody>;
  /** Optional: Transform service result before returning */
  transformResult?: (result: unknown, query: TQuery, body: TBody) => unknown;
  /** Optional: Custom response handler (overrides default jsonResponse) */
  // Type assertion required: responseHandler can return any Response type (NextResponse, Response, etc.)
  // Using 'any' here is necessary because different response types (NextResponse, Response) don't share
  // a common base type that TypeScript can infer. The handler is responsible for returning a valid Response.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseHandler?: (
    result: unknown,
    query: TQuery,
    body: TBody,
    ctx: RouteHandlerContext<TQuery, TBody>
  ) => any;
}

/**
 * WeakMap to store function configurations for cached service methods
 * This avoids capturing functions in closures that Next.js analyzes during prerendering
 */
const cachedServiceMethodConfigs = new WeakMap<
  (query: unknown, body: unknown, nextContext?: unknown) => Promise<unknown>,
  {
    serviceKey: ServiceKey;
    methodName: string;
    methodArgs: (query: unknown, body: unknown, routeParams?: Record<string, string>) => unknown[];
    cacheLifeProfile: CacheLifeProfile;
    cacheTags?:
      | string[]
      | ((query: unknown, body: unknown, routeParams?: Record<string, string>) => string[])
      | undefined;
    getRouteParams?:
      | ((nextContext: unknown) => Promise<Record<string, string>> | Record<string, string>)
      | undefined;
  }
>();

/**
 * Creates a cached helper function for service method calls
 *
 * This generates a function with 'use cache' at the top level, which is required by Next.js Cache Components.
 *
 * Uses WeakMap pattern to avoid capturing function parameters in closures that Next.js analyzes during prerendering.
 * This prevents "Functions cannot be passed directly to Client Components" errors.
 */
function createCachedServiceMethod<TQuery, TBody>(
  serviceKey: ServiceKey,
  methodName: string,
  methodArgs: (query: TQuery, body: TBody, routeParams?: Record<string, string>) => unknown[],
  cacheLifeProfile: CacheLifeProfile,
  cacheTags?:
    | string[]
    | ((query: TQuery, body: TBody, routeParams?: Record<string, string>) => string[]),
  getRouteParams?: (
    nextContext: unknown
  ) => Promise<Record<string, string>> | Record<string, string>
): (query: TQuery, body: TBody, nextContext?: unknown) => Promise<unknown> {
  // Create the cached function without capturing parameters in closure
  // We need to create it with unknown types for WeakMap compatibility, then cast the return type
  const cachedFunctionBase = async (
    query: unknown,
    body: unknown,
    nextContext?: unknown
  ): Promise<unknown> => {
    'use cache';

    // Retrieve configuration from WeakMap at runtime (not captured in closure)
    const config = cachedServiceMethodConfigs.get(cachedFunctionBase);
    if (!config) {
      throw new Error('Cached service method configuration not found');
    }

    // Extract route params if getRouteParams is provided
    const routeParams =
      config.getRouteParams && nextContext ? await config.getRouteParams(nextContext) : undefined;

    // Apply cache life profile
    if (typeof config.cacheLifeProfile === 'string') {
      cacheLife(config.cacheLifeProfile);
    } else {
      cacheLife(config.cacheLifeProfile);
    }

    // Apply cache tags
    if (config.cacheTags) {
      const tags =
        typeof config.cacheTags === 'function'
          ? config.cacheTags(query, body, routeParams)
          : config.cacheTags;
      for (const tag of tags) {
        cacheTag(tag);
      }
    }

    // Get service instance
    const serviceInstance = await getService(config.serviceKey);

    // Get method arguments (including route params)
    // Cast query/body to unknown since config.methodArgs expects unknown
    const args = config.methodArgs(query, body, routeParams);

    // Dynamic method access on service instances
    // Services are stored in a Map<ServiceKey, ServiceTypeMap[ServiceKey]> where ServiceTypeMap
    // is a union of all service types. TypeScript can't verify that a specific service has a
    // specific method name at compile time, so we access methods dynamically with proper type narrowing.
    // The runtime check below (typeof method !== 'function') ensures safety.
    // Use 'unknown' first to avoid unsafe type assertions, then narrow with runtime check
    const serviceRecord = serviceInstance as unknown;
    const serviceMethods = serviceRecord as Record<
      string,
      (...args: unknown[]) => Promise<unknown>
    >;
    const method = serviceMethods[config.methodName];
    if (!method || typeof method !== 'function') {
      throw new Error(
        `Method '${config.methodName}' not found on service '${config.serviceKey}'. ` +
          `Available methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(serviceInstance))
            .filter((m) => m !== 'constructor')
            .join(', ')}`
      );
    }

    return method.apply(serviceInstance, args);
  };

  // Store configuration in WeakMap (not captured in closure)
  // Note: We store methodArgs with unknown types to avoid closure capture, but cast when retrieving
  cachedServiceMethodConfigs.set(cachedFunctionBase, {
    serviceKey,
    methodName,
    methodArgs: methodArgs as (
      query: unknown,
      body: unknown,
      routeParams?: Record<string, string>
    ) => unknown[],
    cacheLifeProfile,
    cacheTags: cacheTags
      ? typeof cacheTags === 'function'
        ? (cacheTags as (
            query: unknown,
            body: unknown,
            routeParams?: Record<string, string>
          ) => string[])
        : cacheTags
      : undefined,
    getRouteParams: getRouteParams ?? undefined,
  });

  // Return function with original generic types (cast to match expected signature)
  return cachedFunctionBase as (
    query: TQuery,
    body: TBody,
    nextContext?: unknown
  ) => Promise<unknown>;
}

/**
 * Creates a cached API route with automatic service instantiation and caching
 *
 * This factory eliminates the repetitive pattern of:
 * - Creating cached helper functions
 * - Manually instantiating services
 * - Calling service methods
 * - Formatting responses
 *
 * @param config - Cached route configuration
 * @returns Next.js route handler function
 *
 * @example
 * ```ts
 * // Simple cached route with service call
 * export const GET = createCachedApiRoute({
 *   route: '/api/company',
 *   operation: 'CompanyAPI',
 *   method: 'GET',
 *   cors: 'anon',
 *   cacheLife: 'long',
 *   cacheTags: (query) => ['companies', `company-${query.slug}`],
 *   querySchema: z.object({ slug: slugSchema }),
 *   service: {
 *     serviceKey: 'companies',
 *     methodName: 'getCompanyProfile',
 *     methodArgs: (query) => [{ p_slug: query.slug }],
 *   },
 * });
 * ```
 */
export function createCachedApiRoute<TQuery = unknown, TBody = unknown>(
  config: CachedApiRouteConfig<TQuery, TBody>
): (request: NextRequest, context?: unknown) => Promise<NextResponse> {
  const {
    route,
    operation,
    method,
    cors = 'anon',
    querySchema,
    bodySchema,
    cacheLife: cacheLifeProfile,
    cacheTags,
    service,
    transformResult,
    responseHandler,
    onError,
    requireAuth,
    optionalAuth,
    authInfo,
    openapi,
  } = config;

  // Create cached service method caller (with 'use cache' at top level)
  const cachedServiceCall = createCachedServiceMethod(
    service.serviceKey,
    service.methodName,
    service.methodArgs,
    cacheLifeProfile,
    cacheTags,
    service.getRouteParams
  );

  // Create handler
  const handler: RouteHandler<TQuery, TBody> = async (ctx) => {
    const { query, body, logger, nextContext } = ctx;

    logger.info({}, `${operation}: executing cached service call`);

    const result = await cachedServiceCall(query, body, nextContext);

    // Transform result if provided
    const transformedResult = transformResult ? transformResult(result, query, body) : result;

    logger.info(
      {
        hasResult: transformedResult !== null && transformedResult !== undefined,
      },
      `${operation}: service call completed`
    );

    // Use custom response handler or default jsonResponse
    if (responseHandler) {
      return await responseHandler(transformedResult, query, body, ctx);
    }

    return jsonResponse(transformedResult, 200, getCorsHeaders(cors));
  };

  // Delegate to createApiRoute with the handler
  const routeConfig: ApiRouteConfig<TQuery, TBody> = {
    route,
    operation,
    method,
    cors,
    handler,
    ...(querySchema && { querySchema }),
    ...(bodySchema && { bodySchema }),
    ...(onError && { onError }),
    ...(requireAuth !== undefined && { requireAuth }),
    ...(optionalAuth !== undefined && { optionalAuth }),
    ...(authInfo && { authInfo }),
    ...(openapi && { openapi }),
  };

  return createApiRoute(routeConfig);
}

// =============================================================================
// Format Handler Factory
// =============================================================================

/**
 * Format handler configuration for multi-format routes
 */
export interface FormatHandlerConfig<TFormat extends string, TQuery = unknown, TBody = unknown> {
  /** Service key */
  serviceKey: ServiceKey;
  /** Service method name */
  methodName: string;
  /** Arguments for service method (receives format, query, body, routeParams) */
  methodArgs: (
    format: TFormat,
    query: TQuery,
    body: TBody,
    routeParams?: Record<string, string>
  ) => unknown[];
  /** Optional: Extract route params from nextContext */
  getRouteParams?: (
    nextContext: unknown
  ) => Promise<Record<string, string>> | Record<string, string>;
  /** Response handler for this format */
  responseHandler: (
    result: unknown,
    format: TFormat,
    query: TQuery,
    body: TBody,
    ctx: RouteHandlerContext<TQuery, TBody>
  ) => Promise<NextResponse<unknown>> | NextResponse<unknown>;
}

/**
 * Configuration for creating a multi-format API route
 *
 * This factory eliminates switch/if statements for format handling by using
 * a configuration map. Each format maps to a service method and response handler.
 */
export interface FormatHandlerRouteConfig<
  TFormat extends string,
  TQuery = unknown,
  TBody = unknown,
> extends Omit<ApiRouteConfig<TQuery, TBody>, 'handler'> {
  /** Cache life profile */
  cacheLife: CacheLifeProfile;
  /** Optional cache tags */
  cacheTags?:
    | string[]
    | ((
        format: TFormat,
        query: TQuery,
        body: TBody,
        routeParams?: Record<string, string>
      ) => string[]);
  /** Format handler configurations (format -> handler config) */
  formats: Record<TFormat, FormatHandlerConfig<TFormat, TQuery, TBody>>;
  /** Default format if not specified in query */
  defaultFormat?: TFormat;
  /** Format query parameter name (default: 'format') */
  formatParamName?: string;
}

/**
 * Creates a multi-format API route handler
 *
 * This factory eliminates the need for switch/if statements in routes that support
 * multiple formats (json, llms-txt, markdown, xml, etc.). Each format is configured
 * with its own service method and response handler.
 *
 * @param config - Format handler route configuration
 * @returns Next.js route handler function
 *
 * @example
 * ```ts
 * export const GET = createFormatHandlerRoute({
 *   route: '/api/v1/content/sitewide',
 *   operation: 'ContentSitewideAPI',
 *   method: 'GET',
 *   cors: 'anon',
 *   cacheLife: 'long',
 *   cacheTags: ['content', 'sitewide'],
 *   querySchema: z.object({ format: sitewideFormatSchema }),
 *   formats: {
 *     json: {
 *       serviceKey: 'content',
 *       methodName: 'getSitewideContentList',
 *       methodArgs: () => [{ p_limit: 5000 }],
 *       responseHandler: (result) => jsonResponse(result, 200, getOnlyCorsHeaders),
 *     },
 *     'llms-txt': {
 *       serviceKey: 'content',
 *       methodName: 'getSitewideLlmsTxt',
 *       methodArgs: () => [],
 *       responseHandler: (result) => textResponse(result as string, 200, getOnlyCorsHeaders),
 *     },
 *   },
 *   defaultFormat: 'llms-txt',
 * });
 * ```
 */
export function createFormatHandlerRoute<TFormat extends string, TQuery = unknown, TBody = unknown>(
  config: FormatHandlerRouteConfig<TFormat, TQuery, TBody>
): (request: NextRequest, context?: unknown) => Promise<NextResponse> {
  const {
    route,
    operation,
    method,
    cors = 'anon',
    querySchema,
    bodySchema,
    cacheLife: cacheLifeProfile,
    cacheTags,
    formats,
    defaultFormat,
    formatParamName = 'format',
    onError,
    requireAuth,
    optionalAuth,
    authInfo,
    openapi,
  } = config;

  // Create cached service method callers for each format
  const formatHandlers = (
    Object.entries(formats) as [TFormat, FormatHandlerConfig<TFormat, TQuery, TBody>][]
  ).map(([format, formatConfig]) => {
    // Create format-specific cache tags function
    const formatCacheTags = cacheTags
      ? (query: TQuery, body: TBody, routeParams?: Record<string, string>) => {
          const tags =
            typeof cacheTags === 'function'
              ? cacheTags(format, query, body, routeParams)
              : cacheTags;
          return tags;
        }
      : undefined;

    const cachedServiceCall = createCachedServiceMethod(
      formatConfig.serviceKey,
      formatConfig.methodName,
      (query, body, routeParams) => formatConfig.methodArgs(format, query, body, routeParams),
      cacheLifeProfile,
      formatCacheTags,
      formatConfig.getRouteParams
    );

    return {
      format,
      cachedServiceCall,
      responseHandler: formatConfig.responseHandler,
    };
  });

  // Create handler
  const handler: RouteHandler<TQuery, TBody> = async (ctx) => {
    const { query, body, logger, nextContext } = ctx;

    // Extract format from query (with default)
    const queryRecord = query as Record<string, unknown>;
    const format = (queryRecord[formatParamName] as TFormat | undefined) ?? defaultFormat;

    if (!format) {
      throw new Error(`Format parameter '${formatParamName}' is required`);
    }

    // Find format handler
    const formatHandler = formatHandlers.find((h) => h.format === format);
    if (!formatHandler) {
      throw new Error(
        `Invalid format '${format}'. Valid formats: ${Object.keys(formats).join(', ')}`
      );
    }

    logger.info({ format }, `${operation}: executing format handler for ${format}`);

    // Call cached service method
    const result = await formatHandler.cachedServiceCall(query, body, nextContext);

    logger.info(
      {
        format,
        hasResult: result !== null && result !== undefined,
      },
      `${operation}: format handler completed`
    );

    // Use format-specific response handler
    return await formatHandler.responseHandler(result, format, query, body, ctx);
  };

  // Delegate to createApiRoute
  const routeConfig: ApiRouteConfig<TQuery, TBody> = {
    route,
    operation,
    method,
    cors,
    handler,
    ...(querySchema && { querySchema }),
    ...(bodySchema && { bodySchema }),
    ...(onError && { onError }),
    ...(requireAuth !== undefined && { requireAuth }),
    ...(optionalAuth !== undefined && { optionalAuth }),
    ...(authInfo && { authInfo }),
    ...(openapi && { openapi }),
  };

  return createApiRoute(routeConfig);
}
