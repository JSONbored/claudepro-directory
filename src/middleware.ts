import arcjet, { detectBot, fixedWindow, shield, tokenBucket } from '@arcjet/next';
import * as nosecone from '@nosecone/next';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isDevelopment, isProduction } from '@/src/lib/env-client';
import { logger } from '@/src/lib/logger';
import { buildRateLimitConfig, isLLMsTxtRoute } from '@/src/lib/middleware/rate-limit-rules';
import { rateLimiters } from '@/src/lib/rate-limiter.server';
import { env, securityConfig } from '@/src/lib/schemas/env.schema';

// Force Node.js runtime for middleware (Redis compression requires node:zlib)
export const runtime = 'nodejs';

import {
  type ApiEndpointType,
  classifyApiEndpoint,
  type RequestValidation,
  requestPathSchema,
  sanitizePathForLogging,
  staticAssetSchema,
  validateRequest,
  validateSearchQuery,
} from '@/src/lib/schemas/middleware.schema';

// Initialize Arcjet with comprehensive security rules
// SECURITY: Require ARCJET_KEY in production for LIVE mode protection
// DEVELOPMENT: Allow DRY_RUN mode without key (Arcjet SDK handles gracefully)
if (isProduction && !securityConfig.arcjetKey) {
  throw new Error(
    'ARCJET_KEY is required for security middleware in production (LIVE mode requires valid key)'
  );
}

// DRY_RUN mode (development): Arcjet performs rule evaluation but doesn't enforce blocks
// LIVE mode (production): Full enforcement requires valid key
const aj = arcjet({
  key: securityConfig.arcjetKey || 'ak_dry_run_placeholder', // Placeholder for DRY_RUN mode
  // In development, Arcjet uses 127.0.0.1 when no real IP is available - this is expected behavior
  rules: [
    // Shield WAF - protect against common attacks
    shield({
      mode: isDevelopment ? 'DRY_RUN' : 'LIVE', // DRY_RUN in development, LIVE in production
    }),

    // Bot protection - block malicious bots, allow good ones
    detectBot({
      mode: isDevelopment ? 'DRY_RUN' : 'LIVE',
      allow: [
        'CATEGORY:SEARCH_ENGINE', // Allow search engines (Google, Bing, etc.)
        'CATEGORY:MONITOR', // Allow monitoring services (uptime monitors)
        'CATEGORY:PREVIEW', // Allow preview bots (social media previews)
      ],
    }),

    // Rate limiting - general API protection with token bucket
    tokenBucket({
      mode: isDevelopment ? 'DRY_RUN' : 'LIVE',
      refillRate: 60, // 60 tokens
      interval: 60, // per 60 seconds (1 minute)
      capacity: 120, // burst capacity of 120 tokens
    }),

    // Fixed window rate limiting for aggressive protection
    fixedWindow({
      mode: isDevelopment ? 'DRY_RUN' : 'LIVE',
      window: '1m', // 1 minute window
      max: 100, // max 100 requests per window
    }),
  ],
});

// Nosecone security headers configuration
// PRODUCTION CSP STRATEGY (2025 Best Practices with Nonces):
// - Dynamic rendering (connection() in layout.tsx) enables per-request nonces
// - Nosecone's built-in nonce() function generates unique nonces per request
// - strict-dynamic added manually (not in Nosecone defaults) - allows nonce-based scripts to load additional scripts
// - Defense in depth: Arcjet WAF + Shield + nonce-based CSP + rate limiting + bot detection
//
// DEVELOPMENT CSP STRATEGY:
// - Same nonce-based approach (consistent across environments)
// - 'unsafe-eval' added for HMR/hot reload compatibility
// - Catches CSP violations during development
const noseconeConfig = {
  ...nosecone.defaults,
  // Extend Nosecone defaults with our trusted sources
  // Note: Nosecone defaults include nonce() for scriptSrc (strict-dynamic added manually in scriptSrc array)
  contentSecurityPolicy: {
    directives: {
      // Start with Nosecone's secure defaults (includes nonce support)
      ...nosecone.defaults.contentSecurityPolicy.directives,

      // Extend scriptSrc to add our trusted sources while keeping nonce + strict-dynamic
      // Nosecone's defaults include: nonce() only (strict-dynamic added manually above)
      // We're adding our analytics and development tools
      scriptSrc: [
        ...(nosecone.defaults.contentSecurityPolicy.directives.scriptSrc || []),
        "'strict-dynamic'", // Allow nonce-based scripts to load additional scripts
        ...(isDevelopment ? (["'unsafe-eval'"] as const) : []), // HMR/hot reload in development only
        'https://umami.claudepro.directory', // Umami analytics
        'https://*.vercel-scripts.com', // Vercel analytics
        'https://vercel.live', // Vercel toolbar
      ],

      // Extend imgSrc with our domains
      imgSrc: [
        ...(nosecone.defaults.contentSecurityPolicy.directives.imgSrc || []),
        'https://github.com',
        'https://*.githubusercontent.com',
        'https://claudepro.directory',
        'https://www.claudepro.directory',
      ],

      // Extend connectSrc for analytics and APIs
      connectSrc: [
        ...(nosecone.defaults.contentSecurityPolicy.directives.connectSrc || []),
        'wss://*.vercel.app', // WebSocket for HMR in preview
        'wss://*.vercel-scripts.com', // Vercel live reload
        'https://umami.claudepro.directory', // Umami analytics
        'https://*.vercel-scripts.com', // Vercel analytics
        'https://vercel.live', // Vercel toolbar
        'https://api.github.com', // GitHub API
        'https://*.supabase.co', // Supabase Auth API (OAuth callbacks)
        'https://accounts.google.com', // Google OAuth (if enabled)
        'https://github.com', // GitHub OAuth
        ...(env.VERCEL_ENV === 'preview'
          ? ([
              'ws://localhost:*',
              'wss://localhost:*',
              ...(env.VERCEL_URL ? [`wss://${env.VERCEL_URL}`] : []),
            ] as const)
          : []),
      ],

      // CSRF Protection: Restrict form submissions to same-origin only
      // This prevents forms from submitting to external domains (CSRF attack vector)
      // Server Actions are automatically protected (POST-only + Next.js headers)
      formAction: ["'self'"],

      // Upgrade insecure requests in production
      upgradeInsecureRequests: isProduction,
    },
  },

  // Keep other security headers from our custom config
  crossOriginEmbedderPolicy: {
    policy: 'credentialless',
  },

  crossOriginOpenerPolicy: {
    policy: 'same-origin-allow-popups',
  },

  crossOriginResourcePolicy: {
    policy: 'cross-origin',
  },

  originAgentCluster: true,

  referrerPolicy: {
    policy: ['no-referrer'],
  },

  strictTransportSecurity: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },

  xContentTypeOptions: true,

  xDnsPrefetchControl: {
    allow: false,
  },

  xDownloadOptions: true,

  xFrameOptions: {
    action: 'deny',
  },

  xPermittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  xXssProtection: true,
};

// Create the Nosecone middleware with Vercel toolbar support in preview
// Using type coercion because Nosecone's types don't support dynamic CSP array construction
// Runtime values are correct - type mismatch is purely due to array spread operations
const resolvedConfig =
  env.VERCEL_ENV === 'preview'
    ? nosecone.withVercelToolbar(noseconeConfig as unknown as typeof nosecone.defaults)
    : undefined;
const noseconeMiddleware = nosecone.createMiddleware(
  (resolvedConfig ?? noseconeConfig) as unknown as typeof nosecone.defaults
);

// OPTIMIZATION: In-memory cache for Nosecone headers to reduce overhead
// Nosecone headers are static per environment, so we can cache and reuse them
// This saves ~3-5ms per request by avoiding header regeneration
let cachedNoseconeHeaders: Headers | null = null;

async function getNoseconeHeaders(): Promise<Headers> {
  if (cachedNoseconeHeaders) {
    // Clone headers to prevent mutation
    return new Headers(cachedNoseconeHeaders);
  }

  const response = await noseconeMiddleware();
  cachedNoseconeHeaders = response.headers;

  // Clone for return to prevent mutation
  return new Headers(cachedNoseconeHeaders);
}

/**
 * Merge security headers from source to target
 * Consolidates duplicate header merging logic across middleware
 */
function mergeSecurityHeaders(target: Headers, source: Headers): void {
  source.forEach((value: string, key: string) => {
    target.set(key, value);
  });
}

/**
 * Apply endpoint-specific rate limiting based on the request path
 */
async function applyEndpointRateLimit(
  request: NextRequest,
  pathname: string
): Promise<Response | null> {
  // Validate the pathname
  try {
    requestPathSchema.parse(pathname);
  } catch (error) {
    logger.error(
      'Invalid pathname detected',
      error instanceof z.ZodError
        ? new Error('Pathname validation failed')
        : new Error(String(error)),
      {
        pathname: sanitizePathForLogging(pathname),
        type: 'validation',
      }
    );
    return new NextResponse('Bad Request', { status: 400 });
  }
  // Classify the API endpoint type
  const endpointType: ApiEndpointType = classifyApiEndpoint(pathname, request.method);

  // Use centralized rate limit configuration
  const rateLimitConfig = buildRateLimitConfig(rateLimiters);

  // Check for exact path matches first
  if (pathname in rateLimitConfig) {
    const limiter = rateLimitConfig[pathname];
    if (limiter) {
      return limiter.middleware(request);
    }
  }

  // LLMs.txt routes - moderate rate limiting to prevent scraping abuse
  if (isLLMsTxtRoute(pathname)) {
    return rateLimiters.llmstxt.middleware(request);
  }

  // Pattern-based matching using classified endpoint type
  if (pathname.startsWith('/api/')) {
    // Use endpoint classification for rate limiting
    switch (endpointType) {
      case 'admin':
        return rateLimiters.admin.middleware(request);
      case 'heavy_api':
        return rateLimiters.heavyApi.middleware(request);
      case 'search':
        // Validate search query parameters if present
        try {
          const searchParams = new URLSearchParams(request.nextUrl.search);
          validateSearchQuery(searchParams);
        } catch (error) {
          logger.error(
            'Invalid search query',
            error instanceof z.ZodError
              ? new Error('Search query validation failed')
              : new Error(String(error)),
            {
              pathname: sanitizePathForLogging(pathname),
              type: 'search_validation',
            }
          );
          return new NextResponse(
            JSON.stringify({
              success: false,
              error: 'Bad Request',
              message: 'Invalid search parameters',
              code: 'SEARCH_VALIDATION_FAILED',
              timestamp: new Date().toISOString(),
            }),
            {
              status: 400,
              headers: { 'content-type': 'application/json' },
            }
          );
        }
        return rateLimiters.search.middleware(request);
      case 'submit':
        return rateLimiters.submit.middleware(request);
      case 'api':
        // Dynamic content type routes (e.g., /api/[contentType])
        if (pathname.match(/^\/api\/[^/]+\.json$/)) {
          return rateLimiters.api.middleware(request);
        }
        return rateLimiters.api.middleware(request);
      case 'static':
        // No rate limiting for static assets
        return null;
      default:
        return rateLimiters.api.middleware(request);
    }
  }

  // No specific rate limiting for non-API endpoints
  return null;
}

export async function middleware(request: NextRequest) {
  const startTime = isDevelopment ? performance.now() : 0;
  const pathname = request.nextUrl.pathname;

  // CRITICAL SECURITY: CVE-2025-29927 mitigation - detect middleware bypass attempts
  // Check for suspicious headers that could bypass middleware execution
  const suspiciousHeaders = [
    'x-middleware-subrequest', // CVE-2025-29927 exploit header
    'x-middleware-rewrite', // Related bypass headers
    'x-middleware-next',
    'x-middleware-invoke',
    'x-invoke-path', // Additional suspicious patterns
    'x-vercel-invoke-path',
  ];

  for (const headerName of suspiciousHeaders) {
    const headerValue = request.headers.get(headerName);
    if (headerValue !== null) {
      logger.error(
        'CVE-2025-29927: Middleware bypass attempt detected',
        new Error('Suspicious header found'),
        {
          header: headerName,
          value: headerValue.substring(0, 100), // Limit logged value length
          ip:
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent')?.substring(0, 100) || 'unknown',
          path: sanitizePathForLogging(pathname),
          method: request.method,
          type: 'security_bypass_attempt',
          severity: 'critical',
          cve: 'CVE-2025-29927',
        }
      );

      // Immediately block the request with security headers
      return new NextResponse('Forbidden: Suspicious header detected', {
        status: 403,
        headers: {
          'X-Security-Event': 'CVE-2025-29927-BLOCKED',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'text/plain',
        },
      });
    }
  }

  // PERFORMANCE OPTIMIZATION: Fast path check BEFORE expensive validation
  // Skip heavy processing for read-only ISR-cached requests
  const isReadOnlyISRPath =
    request.method === 'GET' &&
    (pathname === '/' ||
      pathname.startsWith('/changelog') ||
      pathname.startsWith('/guides') ||
      pathname === '/trending' ||
      pathname === '/companies' ||
      pathname === '/board' ||
      /^\/(agents|mcp|commands|rules|hooks|statuslines|collections|skills)\/[^/]+$/.test(pathname));

  // Skip Arcjet for Next.js RSC prefetch requests (legitimate browser behavior)
  const isRSCRequest = pathname.includes('_rsc=') || request.headers.get('rsc') === '1';

  // Skip Arcjet protection for static assets and Next.js internals
  const isStaticAsset = staticAssetSchema.safeParse(pathname).success;

  // OAuth callback - apply minimal middleware (security headers only, no rate limiting)
  // This prevents middleware from interfering with cookie setting during OAuth flow
  const isOAuthCallback = pathname.startsWith('/auth/callback');

  // Fast path: Apply only Nosecone headers for safe requests (no validation or Arcjet overhead)
  // Saves 50-150ms by skipping bot detection, rate limiting, and WAF checks
  if (isRSCRequest || isStaticAsset || isReadOnlyISRPath || isOAuthCallback) {
    const noseconeHeaders = await getNoseconeHeaders();
    const response = NextResponse.next();

    // Copy all security headers from Nosecone
    mergeSecurityHeaders(response.headers, noseconeHeaders);

    if (isDevelopment) {
      const duration = performance.now() - startTime;
      response.headers.set('X-Middleware-Duration', `${duration.toFixed(2)}ms`);
      logger.debug('Middleware execution (fast path)', {
        path: sanitizePathForLogging(pathname),
        type: isRSCRequest ? 'RSC' : isStaticAsset ? 'static' : isOAuthCallback ? 'OAuth' : 'ISR',
        duration: `${duration.toFixed(2)}ms`,
      });
    }

    if (isOAuthCallback) {
      logger.info('Middleware OAuth callback detected', {
        pathname,
        cookieCount: request.cookies.getAll().length,
      });
    }

    return response;
  }

  // Validate the incoming request (only for non-fast-path requests)
  try {
    const requestValidation: RequestValidation = validateRequest({
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    });

    // Log validated request data (in development only)
    if (isDevelopment) {
      logger.debug('Validated request', {
        method: requestValidation.method,
        path: sanitizePathForLogging(requestValidation.path),
        userAgent: `${requestValidation.userAgent?.slice(0, 50)}...`,
      });
    }
  } catch (error) {
    // Log validation error for monitoring
    logger.error(
      'Request validation failed',
      error instanceof z.ZodError
        ? new Error('Request validation failed')
        : new Error(String(error)),
      {
        pathname: sanitizePathForLogging(pathname),
        method: request.method,
        type: 'request_validation',
      }
    );

    // Return standardized error response
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Bad Request',
        message: 'Invalid request format',
        code: 'REQUEST_VALIDATION_FAILED',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      }
    );
  }

  // REMOVED: /account auth protection moved to route-level layout (src/app/account/layout.tsx)
  // This eliminates async Supabase calls in middleware, reducing latency and failure points
  // Auth is now handled server-side in the layout component (Next.js 15 best practice)
  // Benefits:
  // - No middleware overhead for /account routes
  // - Better error handling at component level
  // - Follows Next.js App Router conventions
  // - Reduces MIDDLEWARE_INVOCATION_FAILED risk from async database calls

  // PERFORMANCE OPTIMIZATION: Run Arcjet and Nosecone in parallel
  // Both operations are independent - Arcjet checks security rules while Nosecone generates headers
  // This saves 5-10ms per request by running concurrently instead of sequentially
  // SECURITY: Using Promise.allSettled for fail-closed behavior - if either fails, we handle gracefully
  // OPTIMIZATION: Using cached Nosecone headers (saves ~3-5ms per request)
  let decision: Awaited<ReturnType<typeof aj.protect>>;
  let noseconeHeaders: Headers;

  try {
    const results = await Promise.allSettled([
      aj.protect(request, { requested: 1 }), // ~20-30ms
      getNoseconeHeaders(), // ~1-2ms (cached)
    ]); // Total: ~20-30ms (concurrent execution)

    // Check Arcjet result (fail-closed: deny on error)
    if (results[0].status === 'rejected') {
      logger.error(
        'Arcjet protection failed',
        results[0].reason instanceof Error
          ? results[0].reason
          : new Error(String(results[0].reason)),
        {
          path: sanitizePathForLogging(pathname),
          type: 'arcjet_failure',
          severity: 'critical',
        }
      );

      // FAIL-CLOSED: Deny access on Arcjet failure for security
      return new NextResponse('Service temporarily unavailable', {
        status: 503,
        headers: {
          'Retry-After': '60',
          'Content-Type': 'text/plain',
        },
      });
    }
    decision = results[0].value;

    // Check Nosecone result (fail-open: continue with basic headers on error)
    if (results[1].status === 'rejected') {
      logger.warn('Nosecone header cache failed, using fallback headers', {
        error:
          results[1].reason instanceof Error
            ? results[1].reason.message
            : String(results[1].reason),
        path: sanitizePathForLogging(pathname),
        type: 'nosecone_failure',
      });

      // FAIL-OPEN: Continue with minimal security headers
      noseconeHeaders = new Headers({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
      });
    } else {
      noseconeHeaders = results[1].value;
    }
  } catch (error) {
    // Catch any unexpected errors from Promise.allSettled itself
    logger.error(
      'Critical middleware error',
      error instanceof Error ? error : new Error(String(error)),
      {
        path: sanitizePathForLogging(pathname),
        type: 'middleware_critical_failure',
        severity: 'critical',
      }
    );

    // FAIL-CLOSED: Deny access on critical failures
    return new NextResponse('Service temporarily unavailable', {
      status: 503,
      headers: {
        'Retry-After': '60',
        'Content-Type': 'text/plain',
      },
    });
  }

  // Handle denied requests
  if (decision.isDenied()) {
    logger.error('Arcjet denied request', new Error(`Request denied: ${decision.conclusion}`), {
      ip: String(decision.ip),
      path: sanitizePathForLogging(pathname),
      reason: String(decision.reason),
      conclusion: decision.conclusion,
      type: 'security_denial',
    });

    // Copy security headers from Nosecone
    const headers = new Headers();
    mergeSecurityHeaders(headers, noseconeHeaders);

    // Return appropriate error response based on denial reason
    if (decision.reason.isRateLimit()) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers,
      });
    }

    if (decision.reason.isBot()) {
      return new NextResponse('Bot Detected', {
        status: 403,
        headers,
      });
    }

    // Shield or other security violations
    return new NextResponse('Forbidden', {
      status: 403,
      headers,
    });
  }

  // Apply endpoint-specific rate limiting after Arcjet
  const rateLimitResponse = await applyEndpointRateLimit(request, pathname);
  if (rateLimitResponse) {
    // Merge security headers from Nosecone
    mergeSecurityHeaders(rateLimitResponse.headers, noseconeHeaders);
    return rateLimitResponse;
  }

  // Request allowed - create new response with pathname header for SmartRelatedContent component
  const response = NextResponse.next();

  // Copy all security headers from Nosecone
  mergeSecurityHeaders(response.headers, noseconeHeaders);

  // Add pathname header for SmartRelatedContent component
  response.headers.set('x-pathname', pathname);

  // Add performance timing in development mode
  if (isDevelopment) {
    const duration = performance.now() - startTime;
    response.headers.set('X-Middleware-Duration', `${duration.toFixed(2)}ms`);
    logger.debug('Middleware execution', {
      path: sanitizePathForLogging(pathname),
      duration: `${duration.toFixed(2)}ms`,
      arcjetDecision: decision.conclusion,
    });
  }

  return response;
}

// Matcher configuration to exclude static assets and improve performance
// This prevents middleware from running on static files, images, and Next.js internal routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/* (all Next.js internal routes including static, image, webpack HMR)
     * - _vercel/* (Vercel internal endpoints: analytics, insights, speed-insights)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap file)
     * - manifest.webmanifest (PWA manifest - Next.js generates from src/app/manifest.ts)
     * - service-worker.js (service worker file)
     * - offline.html (offline fallback page)
     * - .well-known/* (well-known files for verification)
     * - scripts/* (public script files - service workers, etc.)
     * - css/* (public CSS files)
     * - js/* (public JavaScript files)
     * - 863ad0a5c1124f59a060aa77f0861518.txt (IndexNow key file)
     * - *.png, *.jpg, *.jpeg, *.gif, *.webp, *.svg, *.ico (image files)
     * - *.woff, *.woff2, *.ttf, *.eot (font files)
     */
    '/((?!_next|_vercel|favicon.ico|robots.txt|sitemap|manifest|service-worker|offline|scripts/|css/|js/|\\.well-known|863ad0a5c1124f59a060aa77f0861518\\.txt|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
