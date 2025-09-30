import arcjet, { shield, detectBot, tokenBucket, fixedWindow } from '@arcjet/next';
import * as nosecone from '@nosecone/next';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { isDevelopment, isProduction } from '@/lib/env-client';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limiter';
import { env, securityConfig } from '@/lib/schemas';

// Force Node.js runtime for middleware (Redis compression requires node:zlib)
export const runtime = 'nodejs';
import {
  type ApiEndpointType,
  type RequestValidation,
  classifyApiEndpoint,
  requestPathSchema,
  sanitizePathForLogging,
  staticAssetSchema,
  validateRequest,
  validateSearchQuery,
} from '@/lib/schemas';

// Initialize Arcjet with comprehensive security rules
const aj = arcjet({
  key: securityConfig.arcjetKey!,
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
        'CATEGORY:MONITOR',       // Allow monitoring services (uptime monitors)
        'CATEGORY:PREVIEW',        // Allow preview bots (social media previews)
      ],
    }),

    // Rate limiting - general API protection with token bucket
    tokenBucket({
      mode: isDevelopment ? 'DRY_RUN' : 'LIVE',
      refillRate: 60,  // 60 tokens
      interval: 60,    // per 60 seconds (1 minute)
      capacity: 120,   // burst capacity of 120 tokens
    }),

    // Fixed window rate limiting for aggressive protection
    fixedWindow({
      mode: isDevelopment ? 'DRY_RUN' : 'LIVE',
      window: '1m',    // 1 minute window
      max: 100,        // max 100 requests per window
    }),
  ],
});


// Nosecone security headers configuration
// IMPORTANT: We're using 'unsafe-inline' for scripts because:
// 1. Using nonces would require making ALL pages dynamic (no static generation)
// 2. This would significantly impact performance for a content-heavy site
// 3. We still have other security layers (Arcjet WAF, rate limiting, etc.)
const noseconeConfig = {
  ...nosecone.defaults,
  // Custom CSP configuration that allows necessary resources
  contentSecurityPolicy: isDevelopment ? false : {
    directives: {
      // Start with Nosecone's secure defaults
      ...nosecone.defaults.contentSecurityPolicy.directives,

      // Override scriptSrc to allow inline scripts (required for static pages)
      // Remove 'unsafe-eval' in production for better security
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Next.js with static generation
        ...(isDevelopment ? ["'unsafe-eval'"] : []), // Only in development
        "https://umami.claudepro.directory", // Umami analytics
        "https://*.vercel-scripts.com", // Vercel analytics
        "https://vercel.live", // Vercel toolbar
      ],

      // Styles already include 'unsafe-inline' in defaults
      styleSrc: [
        ...nosecone.defaults.contentSecurityPolicy.directives.styleSrc,
      ],

      // Images - extend defaults with GitHub and our domains
      imgSrc: [
        ...nosecone.defaults.contentSecurityPolicy.directives.imgSrc,
        "https://github.com",
        "https://*.githubusercontent.com",
        "https://claudepro.directory",
        "https://www.claudepro.directory",
      ],

      // Fonts - extend defaults
      fontSrc: [
        ...nosecone.defaults.contentSecurityPolicy.directives.fontSrc,
        "data:",
      ],

      // Connect sources - extend defaults with our required domains
      connectSrc: [
        ...nosecone.defaults.contentSecurityPolicy.directives.connectSrc,
        "wss://*.vercel.app", // WebSocket for HMR in preview
        "wss://*.vercel-scripts.com", // Vercel live reload
        "https://umami.claudepro.directory", // Umami analytics
        "https://*.vercel-scripts.com", // Vercel analytics
        "https://vercel.live", // Vercel toolbar
        "https://api.github.com", // GitHub API
        // Preview-specific WebSocket connections
        ...(env.VERCEL_ENV === 'preview' ? [
          "ws://localhost:*",
          "wss://localhost:*",
          env.VERCEL_URL ? `wss://${env.VERCEL_URL}` : "",
        ].filter(Boolean) : []),
      ],

      // Only override what we need to change from defaults
      // Nosecone already sets secure defaults for:
      // - frameAncestors: ['none']
      // - objectSrc: ['none']
      // - baseUri: ['none']
      // - formAction: ['self']
      // - workerSrc: ['self']
      // - childSrc: ['none']

      // Upgrade insecure requests in production (not in defaults)
      upgradeInsecureRequests: isProduction,
    }
  },

  // Cross-Origin Embedder Policy - credentialless for compatibility with external resources
  crossOriginEmbedderPolicy: {
    policy: 'credentialless',
  },

  // Cross-Origin Opener Policy - allow popups for OAuth flows
  crossOriginOpenerPolicy: {
    policy: 'same-origin-allow-popups',
  },

  // Cross-Origin Resource Policy - cross-origin for GitHub images and CDN resources
  crossOriginResourcePolicy: {
    policy: 'cross-origin',
  },

  // Origin Agent Cluster - isolate origin
  originAgentCluster: true,

  // Referrer Policy - no-referrer for privacy
  referrerPolicy: {
    policy: ['no-referrer'],
  },

  // Strict Transport Security - force HTTPS with preload
  strictTransportSecurity: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },

  // X-Content-Type-Options - prevent MIME sniffing
  xContentTypeOptions: true,

  // X-DNS-Prefetch-Control - disable for privacy
  xDnsPrefetchControl: {
    allow: false,
  },

  // X-Download-Options - prevent IE downloads
  xDownloadOptions: true,

  // X-Frame-Options - prevent clickjacking
  xFrameOptions: {
    action: 'deny',
  },

  // X-Permitted-Cross-Domain-Policies - none for security
  xPermittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  // X-XSS-Protection - disable (can cause vulnerabilities in old browsers)
  xXssProtection: true,
};

// Create the Nosecone middleware with Vercel toolbar support in preview
const noseconeMiddleware = nosecone.createMiddleware(
  env.VERCEL_ENV === 'preview'
    ? nosecone.withVercelToolbar(noseconeConfig as any)
    : noseconeConfig as any,
);

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
    logger.error('Invalid pathname detected',
      error instanceof z.ZodError ? new Error('Pathname validation failed') : new Error(String(error)),
      {
        pathname: sanitizePathForLogging(pathname),
        type: 'validation',
      });
    return new NextResponse('Bad Request', { status: 400 });
  }
  // Classify the API endpoint type
  const endpointType: ApiEndpointType = classifyApiEndpoint(pathname, request.method);

  // Define route-specific rate limiting rules
  const rateLimit = {
    // Cache warming endpoint - admin operations (extremely restrictive)
    '/api/cache/warm': rateLimiters.admin, // 5 requests per hour

    // All configurations endpoint - heavy dataset (moderate restrictions)
    '/api/all-configurations.json': rateLimiters.heavyApi, // 50 requests per 15 minutes

    // Individual content type APIs - standard usage (generous)
    '/api/agents.json': rateLimiters.api, // 1000 requests per hour
    '/api/mcp.json': rateLimiters.api,
    '/api/rules.json': rateLimiters.api,
    '/api/commands.json': rateLimiters.api,
    '/api/hooks.json': rateLimiters.api,
  };

  // Check for exact path matches first
  if (pathname in rateLimit) {
    const limiter = rateLimit[pathname as keyof typeof rateLimit];
    return limiter.middleware(request);
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
          logger.error('Invalid search query',
            error instanceof z.ZodError ? new Error('Search query validation failed') : new Error(String(error)),
            {
              pathname: sanitizePathForLogging(pathname),
              type: 'search_validation',
            });
          return new NextResponse(JSON.stringify({
            success: false,
            error: 'Bad Request',
            message: 'Invalid search parameters',
            code: 'SEARCH_VALIDATION_FAILED',
            timestamp: new Date().toISOString(),
          }), {
            status: 400,
            headers: { 'content-type': 'application/json' },
          });
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
    'x-middleware-subrequest',    // CVE-2025-29927 exploit header
    'x-middleware-rewrite',       // Related bypass headers
    'x-middleware-next',
    'x-middleware-invoke',
    'x-invoke-path',             // Additional suspicious patterns
    'x-vercel-invoke-path',
  ];

  for (const headerName of suspiciousHeaders) {
    const headerValue = request.headers.get(headerName);
    if (headerValue !== null) {
      logger.error('CVE-2025-29927: Middleware bypass attempt detected', new Error('Suspicious header found'), {
        header: headerName,
        value: headerValue.substring(0, 100), // Limit logged value length
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent')?.substring(0, 100) || 'unknown',
        path: sanitizePathForLogging(pathname),
        method: request.method,
        type: 'security_bypass_attempt',
        severity: 'critical',
        cve: 'CVE-2025-29927',
      });

      // Immediately block the request with security headers
      return new NextResponse('Forbidden: Suspicious header detected', {
        status: 403,
        headers: {
          'X-Security-Event': 'CVE-2025-29927-BLOCKED',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'text/plain',
        }
      });
    }
  }

  // Validate the incoming request
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
        userAgent: requestValidation.userAgent?.slice(0, 50) + '...',
      });
    }
  } catch (error) {
    // Log validation error for monitoring
    logger.error('Request validation failed',
      error instanceof z.ZodError ? new Error('Request validation failed') : new Error(String(error)),
      {
        pathname: sanitizePathForLogging(pathname),
        method: request.method,
        type: 'request_validation',
      });

    // Return standardized error response
    return new NextResponse(JSON.stringify({
      success: false,
      error: 'Bad Request',
      message: 'Invalid request format',
      code: 'REQUEST_VALIDATION_FAILED',
      timestamp: new Date().toISOString(),
    }), {
      status: 400,
      headers: {
        'content-type': 'application/json',
      },
    });
  }

  // Skip Arcjet protection for static assets and Next.js internals
  const isStaticAsset = staticAssetSchema.safeParse(pathname).success;

  // For static assets, only apply Nosecone security headers (no Arcjet needed)
  if (isStaticAsset) {
    const noseconeResponse = await noseconeMiddleware();

    if (isDevelopment) {
      const duration = performance.now() - startTime;
      logger.debug('Middleware execution (static asset)', {
        path: sanitizePathForLogging(pathname),
        duration: `${duration.toFixed(2)}ms`,
      });
    }

    return noseconeResponse;
  }

  // PERFORMANCE OPTIMIZATION: Run Arcjet and Nosecone in parallel
  // Both operations are independent - Arcjet checks security rules while Nosecone generates headers
  // This saves 5-10ms per request by running concurrently instead of sequentially
  // SECURITY: Using Promise.allSettled for fail-closed behavior - if either fails, we handle gracefully
  let decision: Awaited<ReturnType<typeof aj.protect>>;
  let noseconeResponse: Response;

  try {
    const results = await Promise.allSettled([
      aj.protect(request, { requested: 1 }), // ~20-30ms
      noseconeMiddleware(),                   // ~5-10ms
    ]); // Total: ~20-30ms (concurrent execution)

    // Check Arcjet result (fail-closed: deny on error)
    if (results[0].status === 'rejected') {
      logger.error('Arcjet protection failed',
        results[0].reason instanceof Error ? results[0].reason : new Error(String(results[0].reason)),
        {
          path: sanitizePathForLogging(pathname),
          type: 'arcjet_failure',
          severity: 'critical',
        });

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
      logger.warn('Nosecone middleware failed, using fallback headers', {
        error: results[1].reason instanceof Error ? results[1].reason.message : String(results[1].reason),
        path: sanitizePathForLogging(pathname),
        type: 'nosecone_failure',
      });

      // FAIL-OPEN: Continue with minimal security headers
      noseconeResponse = new NextResponse(null, {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'no-referrer',
        },
      });
    } else {
      noseconeResponse = results[1].value;
    }
  } catch (error) {
    // Catch any unexpected errors from Promise.allSettled itself
    logger.error('Critical middleware error',
      error instanceof Error ? error : new Error(String(error)),
      {
        path: sanitizePathForLogging(pathname),
        type: 'middleware_critical_failure',
        severity: 'critical',
      });

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
    logger.error('Arcjet denied request',
      new Error(`Request denied: ${decision.conclusion}`),
      {
        ip: String(decision.ip),
        path: sanitizePathForLogging(pathname),
        reason: String(decision.reason),
        conclusion: decision.conclusion,
        type: 'security_denial',
      });

    // Copy security headers from Nosecone response
    const headers = new Headers();
    mergeSecurityHeaders(headers, noseconeResponse.headers);

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
    mergeSecurityHeaders(rateLimitResponse.headers, noseconeResponse.headers);
    return rateLimitResponse;
  }

  // Request allowed - create new response with pathname header for SmartRelatedContent component
  const response = NextResponse.next();

  // Copy all security headers from nosecone
  mergeSecurityHeaders(response.headers, noseconeResponse.headers);

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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap file)
     * - manifest.json (PWA manifest)
     * - .well-known (well-known files for verification)
     * - /js/ (public JavaScript files)
     * - /css/ (public CSS files)
     * - *.png, *.jpg, *.jpeg, *.gif, *.webp, *.svg, *.ico (image files)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|\\.well-known|js/|css/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)',
  ],
};