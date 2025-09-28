import arcjet, { shield, detectBot, tokenBucket, fixedWindow } from '@arcjet/next';
import * as nosecone from '@nosecone/next';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limiter';
import { env, isDevelopment, securityConfig } from '@/lib/schemas/env.schema';
import {
  type ApiEndpointType,
  type RequestValidation,
  classifyApiEndpoint,
  requestPathSchema,
  sanitizePathForLogging,
  staticAssetSchema,
  validateRequest,
  validateSearchQuery,
} from '@/lib/schemas/middleware.schema';

// Initialize Arcjet with comprehensive security rules
const aj = arcjet({
  key: securityConfig.arcjetKey!,
  // In development, Arcjet uses 127.0.0.1 when no real IP is available - this is expected behavior
  rules: [
    // Shield WAF - protect against common attacks
    shield({
      mode: 'LIVE', // LIVE mode blocks malicious requests
    }),

    // Bot protection - block malicious bots, allow good ones
    detectBot({
      mode: 'LIVE',
      allow: [
        'CATEGORY:SEARCH_ENGINE', // Allow search engines (Google, Bing, etc.)
        'CATEGORY:MONITOR',       // Allow monitoring services (uptime monitors)
        'CATEGORY:PREVIEW',        // Allow preview bots (social media previews)
      ],
    }),

    // Rate limiting - general API protection with token bucket
    tokenBucket({
      mode: 'LIVE',
      refillRate: 60,  // 60 tokens
      interval: 60,    // per 60 seconds (1 minute)
      capacity: 120,   // burst capacity of 120 tokens
    }),

    // Fixed window rate limiting for aggressive protection
    fixedWindow({
      mode: 'LIVE',
      window: '1m',    // 1 minute window
      max: 100,        // max 100 requests per window
    }),
  ],
});


// Nosecone security headers configuration
const noseconeConfig: nosecone.NoseconeOptions = {
  ...nosecone.defaults,
  // Disable CSP entirely in development mode
  // In production, use full CSP with external script sources
  contentSecurityPolicy: isDevelopment ? false : true, // Will be replaced with dynamic CSP

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
    ? nosecone.withVercelToolbar(noseconeConfig)
    : noseconeConfig,
);

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
  const pathname = request.nextUrl.pathname;

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

  // Apply Nosecone security headers to all requests
  const noseconeResponse = await noseconeMiddleware();

  // For static assets, just return with security headers
  if (isStaticAsset) {
    return noseconeResponse;
  }

  // Apply Arcjet protection for non-static routes
  // For token bucket rules, we need to pass requested tokens
  const decision = await aj.protect(request, { requested: 1 });

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
    noseconeResponse.headers.forEach((value: string, key: string) => {
      headers.set(key, value);
    });

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
    noseconeResponse.headers.forEach((value: string, key: string) => {
      rateLimitResponse.headers.set(key, value);
    });
    return rateLimitResponse;
  }

  // Request allowed - create new response with pathname header for SmartRelatedContent component
  const response = NextResponse.next();

  // Copy all security headers from nosecone
  noseconeResponse.headers.forEach((value: string, key: string) => {
    response.headers.set(key, value);
  });

  // Add pathname header for SmartRelatedContent component
  response.headers.set('x-pathname', pathname);

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