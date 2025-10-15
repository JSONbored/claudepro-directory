/**
 * Centralized Error & Response Handling System
 *
 * Production-grade error handling + standardized API responses.
 * Consolidates error formatting, success responses, and caching logic.
 * Designed with security-first approach for open-source production codebase.
 *
 * **Consolidation Benefits:**
 * - Single source of truth for ALL API responses (errors + success)
 * - Consistent cache headers across all endpoints
 * - Tree-shakeable named exports
 * - Type-safe response construction
 * - Eliminates response duplication across 8+ API routes
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { APP_CONFIG } from '@/src/lib/constants';
import { isDevelopment, isProduction } from '@/src/lib/env-client';
import { logger } from '@/src/lib/logger';
import { type RateLimiter, withRateLimit } from '@/src/lib/rate-limiter';
import { createRequestId, type RequestId } from '@/src/lib/schemas/branded-types.schema';
import {
  determineErrorType,
  type ErrorContext,
  type ErrorHandlerConfig,
  type ErrorResponse,
  type ErrorType,
  errorInputSchema,
  validateErrorContext,
  validateErrorInput,
} from '@/src/lib/schemas/error.schema';
import { ValidationError, validation } from '@/src/lib/security/validators';

/**
 * HTTP status code mapping for different error types
 */
const ERROR_STATUS_MAP: Record<ErrorType, number> = {
  ValidationError: 400,
  DatabaseError: 500,
  AuthenticationError: 401,
  AuthorizationError: 403,
  NotFoundError: 404,
  RateLimitError: 429,
  NetworkError: 502,
  FileSystemError: 500,
  ConfigurationError: 500,
  TimeoutError: 504,
  ServiceUnavailableError: 503,
  InternalServerError: 500,
} as const;

/**
 * User-friendly error messages
 */
const USER_FRIENDLY_MESSAGES: Record<ErrorType, string> = {
  ValidationError: 'The provided data is invalid. Please check your input and try again.',
  DatabaseError: 'A database error occurred. Please try again later.',
  AuthenticationError: 'Authentication failed. Please check your credentials.',
  AuthorizationError: 'You do not have permission to access this resource.',
  NotFoundError: 'The requested resource was not found.',
  RateLimitError: 'Too many requests. Please try again later.',
  NetworkError: 'A network error occurred. Please try again.',
  FileSystemError: 'A file system error occurred. Please try again later.',
  ConfigurationError: 'A configuration error occurred. Please contact support.',
  TimeoutError: 'The request timed out. Please try again.',
  ServiceUnavailableError: 'The service is temporarily unavailable. Please try again later.',
  InternalServerError: 'An internal server error occurred. Please try again later.',
} as const;

/**
 * Central error handler class
 */
export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle any error and return standardized response
   */
  public handleError(
    error: z.infer<typeof errorInputSchema>,
    config: ErrorHandlerConfig = {}
  ): ErrorResponse {
    const startTime = performance.now();

    try {
      // Validate and extract error information
      const validationResult = validateErrorInput(error);
      const validatedError = validationResult.type === 'error' ? validationResult.error : undefined;
      const fallback =
        validationResult.type === 'string' || validationResult.type === 'invalid'
          ? validationResult.fallback
          : undefined;
      const errorType = determineErrorType(error);

      // Generate request ID if not provided
      const requestId = config.requestId || this.generateRequestId();

      // Create base error context
      const baseContext: ErrorContext = {
        route: config.route || 'unknown',
        operation: config.operation || 'unknown',
        method: config.method || 'unknown',
        errorType,
        timestamp: new Date().toISOString(),
      };

      // Merge with provided context
      const fullContext = validateErrorContext({
        ...baseContext,
        ...config.logContext,
        requestId,
        userId: config.userId,
        processingTime: `${(performance.now() - startTime).toFixed(2)}ms`,
      });

      // Log the error with appropriate level
      this.logError(error, errorType, fullContext, config.logLevel || 'error');

      // Handle specific error types
      if (error instanceof z.ZodError) {
        return this.handleZodError(error, requestId, config);
      }

      if (error instanceof ValidationError) {
        return this.handleValidationError(error, requestId, config);
      }

      // Handle generic errors - create a proper Error object
      const errorToHandle = validatedError
        ? new Error(validatedError.message)
        : new Error(fallback || 'Unknown error');

      // Copy properties if they exist
      if (validatedError) {
        if (validatedError.name) errorToHandle.name = validatedError.name;
        if (validatedError.stack) errorToHandle.stack = validatedError.stack;
      }

      return this.handleGenericError(errorToHandle, errorType, requestId, config);
    } catch (handlerError) {
      // Fallback error handling if the error handler itself fails
      logger.fatal(
        'Error handler failed',
        handlerError instanceof Error ? handlerError : new Error(String(handlerError)),
        {
          originalError: error instanceof Error ? error.message : String(error),
          handlerError: handlerError instanceof Error ? handlerError.message : String(handlerError),
        }
      );

      return this.createFallbackErrorResponse(config.requestId);
    }
  }

  /**
   * Handle Zod validation errors specifically
   */
  private handleZodError(
    zodError: z.ZodError,
    requestId: RequestId,
    config: ErrorHandlerConfig
  ): ErrorResponse {
    const details = zodError.issues.map((issue) => ({
      path: issue.path.join('.') || 'root',
      message: issue.message,
      code: issue.code.toUpperCase(),
    }));

    const mainMessage =
      config.customMessage || `Validation failed: ${details[0]?.message || 'Invalid input'}`;

    return {
      success: false,
      error: 'Validation Error',
      message: mainMessage,
      code: 'VALIDATION_FAILED',
      timestamp: new Date().toISOString(),
      requestId,
      ...(config.includeDetails !== false && { details }),
      ...(config.includeStack && isDevelopment && zodError.stack && { stack: zodError.stack }),
    };
  }

  /**
   * Handle custom ValidationError instances
   */
  private handleValidationError(
    validationError: ValidationError,
    requestId: RequestId,
    config: ErrorHandlerConfig
  ): ErrorResponse {
    return this.handleZodError(validationError.details, requestId, {
      ...config,
      customMessage: config.customMessage || validationError.message,
    });
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(
    error: Error,
    errorType: ErrorType,
    requestId: RequestId,
    config: ErrorHandlerConfig
  ): ErrorResponse {
    const userMessage =
      config.customMessage ||
      (config.hideInternalErrors !== false && isProduction
        ? USER_FRIENDLY_MESSAGES[errorType] || error.message
        : error.message);

    const response: ErrorResponse = {
      success: false,
      error: errorType.replace('Error', ' Error'),
      message: userMessage,
      code: this.generateErrorCode(errorType),
      timestamp: new Date().toISOString(),
      requestId,
    };

    // Include stack trace in development or if explicitly requested
    if ((isDevelopment || config.includeStack) && error.stack) {
      response.stack = error.stack;
    }

    return response;
  }

  /**
   * Create fallback error response when error handler fails
   */
  private createFallbackErrorResponse(requestId?: RequestId): ErrorResponse {
    return {
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      requestId: requestId || this.generateRequestId(),
    };
  }

  /**
   * Log errors with appropriate level and context
   */
  private logError(
    error: z.infer<typeof errorInputSchema>,
    errorType: ErrorType,
    context: ErrorContext | null,
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logMessage = `${errorType}: ${errorMessage}`;

    const logContext = context || {};
    const metadata: Record<string, string | number | boolean> = {
      errorType,
      errorConstructor: error?.constructor?.name || 'Unknown',
      hasStack: error instanceof Error && Boolean(error.stack),
    };

    switch (level) {
      case 'debug':
        logger.debug(logMessage, logContext, metadata);
        break;
      case 'info':
        logger.info(logMessage, logContext, metadata);
        break;
      case 'warn':
        logger.warn(logMessage, logContext, metadata);
        break;
      case 'error':
        logger.error(
          logMessage,
          error instanceof Error ? error : new Error(String(error)),
          logContext,
          metadata
        );
        break;
      case 'fatal':
        logger.fatal(
          logMessage,
          error instanceof Error ? error : new Error(String(error)),
          logContext,
          metadata
        );
        break;
      default:
        logger.error(
          logMessage,
          error instanceof Error ? error : new Error(String(error)),
          logContext,
          metadata
        );
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): RequestId {
    return createRequestId();
  }

  /**
   * Generate structured error codes
   */
  private generateErrorCode(errorType: ErrorType): string {
    const typeCode = errorType.replace('Error', '').toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${typeCode.slice(0, 3)}_${timestamp.slice(-8)}`;
  }

  /**
   * Create Next.js Response from ErrorResponse
   */
  public createNextResponse(
    error: z.infer<typeof errorInputSchema>,
    config: ErrorHandlerConfig = {}
  ): NextResponse {
    const errorResponse = this.handleError(error, config);
    const statusCode = this.getStatusCodeForError(error);

    return NextResponse.json(errorResponse, {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Request-ID': errorResponse.requestId || '',
      },
    });
  }

  /**
   * Get appropriate HTTP status code for error
   */
  private getStatusCodeForError(error: unknown): number {
    const errorType = determineErrorType(error);
    return ERROR_STATUS_MAP[errorType] || 500;
  }

  /**
   * Async error handler for use in try-catch blocks
   */
  public async handleAsync<T>(
    operation: () => Promise<T>,
    config: ErrorHandlerConfig = {}
  ): Promise<{ success: true; data: T } | { success: false; error: ErrorResponse }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const validatedError = errorInputSchema.safeParse(error);
      const errorResponse = this.handleError(
        validatedError.success ? validatedError.data : { message: 'Unknown error occurred' },
        config
      );
      return { success: false, error: errorResponse };
    }
  }

  /**
   * Middleware-friendly error handler for Next.js
   */
  public handleMiddlewareError(
    error: z.infer<typeof errorInputSchema>,
    request: NextRequest,
    config: Partial<ErrorHandlerConfig> = {}
  ): NextResponse {
    const url = new URL(request.url);
    const headerRequestId = request.headers.get('x-request-id');
    const requestId = headerRequestId ? (headerRequestId as RequestId) : this.generateRequestId();

    const fullConfig: ErrorHandlerConfig = {
      route: url.pathname,
      method: request.method,
      requestId,
      logContext: {
        userAgent: request.headers.get('user-agent') || '',
        ip: request.headers.get('x-forwarded-for') || '',
        referer: request.headers.get('referer') || '',
      },
      ...config,
    };

    return this.createNextResponse(error, fullConfig);
  }
}

// Singleton instance
const errorHandler = ErrorHandler.getInstance();

// Convenience functions for common use cases
export const handleApiError = (
  error: z.infer<typeof errorInputSchema>,
  config: ErrorHandlerConfig = {}
): NextResponse => {
  return errorHandler.createNextResponse(error, {
    hideInternalErrors: true,
    sanitizeResponse: true,
    logLevel: 'error',
    ...config,
  });
};

export const handleValidationError = (
  validationError: ValidationError,
  config: ErrorHandlerConfig = {}
): NextResponse => {
  return errorHandler.createNextResponse(validationError, {
    includeDetails: true,
    logLevel: 'warn',
    ...config,
  });
};

// React component error boundary helper moved to @/src/lib/error-handler/client
// to avoid bundling server-only code in client components
// Import from '@/src/lib/error-handler/client' instead

// ============================================
// SUCCESS RESPONSE BUILDERS
// ============================================

/**
 * Cache control options for success responses
 */
export interface CacheOptions {
  /** Max age in seconds for CDN cache */
  sMaxAge?: number;
  /** Stale-while-revalidate in seconds */
  staleWhileRevalidate?: number;
  /** Whether response is from cache */
  cacheHit?: boolean;
  /** Additional cache headers */
  additionalHeaders?: Record<string, string>;
}

/**
 * Default cache settings (4 hours / 24 hours)
 */
const DEFAULT_CACHE: Required<Omit<CacheOptions, 'cacheHit' | 'additionalHeaders'>> = {
  sMaxAge: 14400, // 4 hours
  staleWhileRevalidate: 86400, // 24 hours
};

/**
 * Build successful API response with consistent structure
 * Tree-shakeable named export
 *
 * @param data - Response data
 * @param options - Cache and metadata options
 * @returns NextResponse with standardized structure
 */
export function buildSuccessResponse<T>(
  data: T,
  options: CacheOptions = {}
): NextResponse<{ data: T; timestamp: string; count?: number }> {
  const {
    sMaxAge = DEFAULT_CACHE.sMaxAge,
    staleWhileRevalidate = DEFAULT_CACHE.staleWhileRevalidate,
    cacheHit = false,
    additionalHeaders = {},
  } = options;

  const response = {
    data,
    timestamp: new Date().toISOString(),
    ...(Array.isArray(data) && { count: data.length }),
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
      'X-Cache': cacheHit ? 'HIT' : 'MISS',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      ...additionalHeaders,
    },
  });
}

/**
 * Unified API response builder
 * Provides consistent headers, cache behavior, and optional output validation.
 * Tree-shakeable named exports via the `response` object.
 */
type ZodSchemaUnknown = z.ZodSchema<unknown>;

export interface OkResponseOptions extends ApiOkOptions {
  /** Additional headers to set on the response */
  headers?: Record<string, string>;
  /** Optional Zod schema to validate response payload in development */
  validate?: ZodSchemaUnknown;
  /** Request id for correlation (auto-included by route factory) */
  requestId?: RequestId;
}

function buildCacheHeaders(options: CacheOptions): Record<string, string> {
  const {
    sMaxAge = DEFAULT_CACHE.sMaxAge,
    staleWhileRevalidate = DEFAULT_CACHE.staleWhileRevalidate,
    cacheHit = false,
  } = options;

  return {
    'Cache-Control': `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
    'X-Cache': cacheHit ? 'HIT' : 'MISS',
  };
}

function withBaseHeaders(
  headers: Record<string, string> | undefined,
  requestId?: RequestId
): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    ...(requestId ? { 'X-Request-ID': String(requestId) } : {}),
    ...(headers || {}),
  };
}

function validateOutputIfNeeded(data: unknown, validate?: ZodSchemaUnknown): void {
  if (!validate) return;
  try {
    // Only enforce strict validation during development to avoid breaking production unexpectedly
    if (isDevelopment) {
      validate.parse(data);
    }
  } catch (error) {
    // If validation fails, throw a ZodError to be handled by error utilities
    throw error;
  }
}

function okInternal<T>(data: T, options: OkResponseOptions = {}): NextResponse {
  const {
    envelope = true,
    status = 200,
    additionalHeaders = {},
    headers,
    requestId,
    validate,
    ...cache
  } = options;

  // Validate outgoing payload if requested (dev-only enforcement)
  try {
    validateOutputIfNeeded(data, validate);
  } catch (err) {
    // Build sanitized error response using centralized handler
    return handleApiError(err instanceof Error ? err : new Error(String(err)), {
      customMessage: 'Invalid response payload',
      logLevel: 'error',
      requestId,
    });
  }

  const cacheHeaders = buildCacheHeaders(cache);
  const baseHeaders = withBaseHeaders(
    { ...cacheHeaders, ...additionalHeaders, ...(headers || {}) },
    requestId
  );

  if (!envelope) {
    return NextResponse.json(data, { headers: baseHeaders, status });
  }

  // Use existing success envelope builder for consistency
  return buildSuccessResponse(data, {
    ...cache,
    additionalHeaders: baseHeaders,
  });
}

function okRawInternal<T>(data: T, options?: Omit<OkResponseOptions, 'envelope'>): NextResponse {
  return okInternal<T>(data, { ...(options || {}), envelope: false });
}

function rawInternal(
  body: BodyInit | null,
  options: {
    contentType: string;
    status?: number;
    headers?: Record<string, string>;
    cache?: CacheOptions;
    requestId?: RequestId;
  }
): NextResponse {
  const { contentType, status = 200, headers, cache, requestId } = options;
  const cacheHeaders = buildCacheHeaders(cache || {});
  const baseHeaders = withBaseHeaders(
    { 'Content-Type': contentType, ...cacheHeaders, ...(headers || {}) },
    requestId
  );
  return new NextResponse(body, { status, headers: baseHeaders });
}

export const apiResponse = {
  ok: okInternal,
  okRaw: okRawInternal,
  paginated: buildPaginatedResponse,
  raw: rawInternal,
  error: handleApiError,
} as const;

/**
 * Build paginated response with metadata
 * Tree-shakeable named export
 */
export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
  cacheOptions: CacheOptions = {}
): NextResponse {
  const totalPages = Math.ceil(total / limit);

  return buildSuccessResponse(items, {
    ...cacheOptions,
    additionalHeaders: {
      'X-Total-Count': total.toString(),
      'X-Page': page.toString(),
      'X-Per-Page': limit.toString(),
      'X-Total-Pages': totalPages.toString(),
      ...cacheOptions.additionalHeaders,
    },
  });
}

/**
 * Transform content items with type and URL
 * Standardized transformation used across multiple endpoints
 * Tree-shakeable named export
 */
export function transformContentItems<T extends { slug: string }>(
  content: readonly T[] | T[],
  type: string,
  category: string
): (T & { type: string; url: string })[] {
  return content.map((item) => ({
    ...item,
    type,
    url: `${APP_CONFIG.url}/${category}/${item.slug}`,
  }));
}

// ============================================
// STANDARDIZED API ROUTE FACTORY
// ============================================

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type ZodSchemaLike<T> = z.ZodSchema<T>;

export interface RouteValidationSchemas<P = unknown, Q = unknown, H = unknown, B = unknown> {
  params?: ZodSchemaLike<P>;
  query?: ZodSchemaLike<Q>;
  headers?: ZodSchemaLike<H>;
  body?: ZodSchemaLike<B>;
}

export interface ApiOkOptions extends CacheOptions {
  envelope?: boolean; // if false, return raw JSON body (no { data })
  status?: number; // optional HTTP status override
}

export interface ApiHandlerContext<P = unknown, Q = unknown, H = unknown, B = unknown> {
  request: NextRequest;
  params: P;
  query: Q;
  headers: H;
  body: B;
  logger: ReturnType<typeof logger.forRequest>;
  ok: <T>(data: T, options?: ApiOkOptions) => NextResponse;
  okRaw: <T>(data: T, options?: Omit<ApiOkOptions, 'envelope'>) => NextResponse;
}

type ApiMethodHandler<P = unknown, Q = unknown, H = unknown, B = unknown> = (
  ctx: ApiHandlerContext<P, Q, H, B>
) => Promise<Response | NextResponse | unknown>;

export interface CreateApiRouteOptions<P = any, Q = any, H = any, B = any> {
  validate?: RouteValidationSchemas<P, Q, H, B>;
  rateLimit?: { limiter?: RateLimiter };
  auth?: { type?: 'devOnly' | 'cron' };
  response?: ApiOkOptions;
  handlers: Partial<Record<HttpMethod, ApiMethodHandler<P, Q, H, B>>>;
}

function isResponse(value: unknown): value is Response | NextResponse {
  if (!value || typeof value !== 'object') return false;
  const anyVal = value as any;
  return typeof anyVal.headers === 'object' && typeof anyVal.status === 'number';
}

function cloneWithHeaders(original: Response, headers: Record<string, string>): Response {
  const newHeaders = new Headers(original.headers);
  for (const [k, v] of Object.entries(headers)) newHeaders.set(k, v);
  return new Response(original.body, {
    status: original.status,
    statusText: original.statusText,
    headers: newHeaders,
  });
}

/**
 * Create standardized route handlers for Next.js App Router.
 * Usage in a route file:
 *
 * const { GET, POST } = createApiRoute({ ... });
 * export { GET, POST };
 */
export function createApiRoute<P = any, Q = any, H = any, B = any>(
  options: CreateApiRouteOptions<P, Q, H, B>
): Partial<
  Record<HttpMethod, (request: NextRequest, context?: { params?: unknown }) => Promise<Response>>
> {
  const { validate, rateLimit, auth, response, handlers } = options;

  const wrap = (
    method: HttpMethod,
    handler?: ApiMethodHandler<P, Q, H, B>
  ): ((request: NextRequest, context?: { params?: unknown }) => Promise<Response>) | undefined => {
    if (!handler) return undefined;

    return async (request: NextRequest, context?: { params?: unknown }) => {
      const url = new URL(request.url);

      // Resolve params (supports both direct object and Promise as seen in legacy code)
      const rawParams = context?.params as unknown;
      const resolvedParams =
        rawParams && typeof (rawParams as Promise<unknown>)?.then === 'function'
          ? await (rawParams as Promise<unknown>).catch(() => ({}))
          : rawParams || {};

      // Request ID
      const headerRequestId = request.headers.get('x-request-id');
      const requestId = (headerRequestId as RequestId) || createRequestId();

      // Auth guards
      if (auth?.type === 'devOnly' && isProduction) {
        return handleApiError(new Error('Endpoint available only in development'), {
          route: url.pathname,
          method,
          operation: 'dev_only_guard',
          requestId,
          logLevel: 'warn',
        });
      }

      if (auth?.type === 'cron') {
        // Dynamic import to avoid bundling server-only code in client builds
        const { verifyCronAuth } = await import('@/src/lib/middleware/cron-auth');
        const authError = verifyCronAuth(request);
        if (authError) return cloneWithHeaders(authError, { 'X-Request-ID': requestId });
      }

      // Build context with validation
      try {
        const queryObj = Object.fromEntries(request.nextUrl.searchParams);

        const parsedParams = validate?.params
          ? validation.validate(validate.params, resolvedParams, 'route parameters')
          : (resolvedParams as P);
        const parsedQuery = validate?.query
          ? validation.validate(validate.query, queryObj, 'query parameters')
          : (queryObj as Q);
        const headersObj = Object.fromEntries(request.headers.entries());
        const parsedHeaders = validate?.headers
          ? validation.validate(validate.headers, headersObj, 'request headers')
          : (headersObj as H);

        let parsedBody: B = {} as B;
        if (validate?.body) {
          const contentType = request.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const json = await request.json().catch(() => ({}));
            parsedBody = validation.validate(validate.body, json, 'request body') as B;
          } else if (method !== 'GET' && method !== 'DELETE') {
            // Non-JSON body - treat as empty and rely on handler if needed
            parsedBody = validation.validate(validate.body, {}, 'request body') as B;
          }
        }

        const requestLogger = logger.forRequest(request);

        const ok = <T>(data: T, opts?: ApiOkOptions) =>
          apiResponse.ok<T>(data, {
            ...(opts || {}),
            headers: { ...(opts?.additionalHeaders || {}), 'X-Request-ID': requestId },
            requestId,
          });

        const okRaw = <T>(data: T, opts?: Omit<ApiOkOptions, 'envelope'>) =>
          apiResponse.okRaw<T>(data, {
            ...(opts || {}),
            headers: { ...(opts?.additionalHeaders || {}), 'X-Request-ID': requestId },
            requestId,
          });

        const ctx: ApiHandlerContext<P, Q, H, B> = {
          request,
          params: parsedParams,
          query: parsedQuery,
          headers: parsedHeaders,
          body: parsedBody,
          logger: requestLogger,
          ok,
          okRaw,
        };

        // Invoke handler with optional rate limiting
        const invoke = async (): Promise<Response> => {
          const result = await handler(ctx);
          if (isResponse(result)) {
            return cloneWithHeaders(result, { 'X-Request-ID': requestId });
          }
          // Default success path uses envelope unless overridden at factory level
          const useEnvelope = response?.envelope !== false;
          const res = ok(result as unknown, { ...(response ?? {}), envelope: useEnvelope });
          return res;
        };

        if (rateLimit?.limiter) {
          // withRateLimit will also add X-RateLimit-* headers on success
          return await withRateLimit(request, rateLimit.limiter, invoke);
        }

        return await invoke();
      } catch (error) {
        return handleApiError(error instanceof Error ? error : new Error(String(error)), {
          route: url.pathname,
          method,
          operation: 'api_route_handler',
          requestId,
        });
      }
    };
  };

  const result: Partial<
    Record<HttpMethod, (request: NextRequest, context?: { params?: unknown }) => Promise<Response>>
  > = {};
  const getHandler = wrap('GET', handlers.GET);
  if (getHandler) result.GET = getHandler;
  const postHandler = wrap('POST', handlers.POST);
  if (postHandler) result.POST = postHandler;
  const putHandler = wrap('PUT', handlers.PUT);
  if (putHandler) result.PUT = putHandler;
  const deleteHandler = wrap('DELETE', handlers.DELETE);
  if (deleteHandler) result.DELETE = deleteHandler;
  const patchHandler = wrap('PATCH', handlers.PATCH);
  if (patchHandler) result.PATCH = patchHandler;

  return result;
}
