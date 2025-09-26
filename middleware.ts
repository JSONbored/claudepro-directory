import arcjet, { shield, detectBot, tokenBucket, fixedWindow } from '@arcjet/next';
import * as nosecone from '@nosecone/next';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { rateLimiters } from '@/lib/rate-limiter';
import { env, isDevelopment, isProduction, securityConfig } from '@/lib/schemas/env.schema';
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
  contentSecurityPolicy: {
    ...nosecone.defaults.contentSecurityPolicy,
    directives: {
      ...nosecone.defaults.contentSecurityPolicy.directives,

      // Script sources - Nosecone defaults already include nonce function
      // We just add our external scripts
      scriptSrc: isDevelopment ? [
        ...nosecone.defaults.contentSecurityPolicy.directives.scriptSrc,
        'https://umami.claudepro.directory',
        'https://va.vercel-scripts.com',
        'https://vercel.live',
        'https://vitals.vercel-insights.com',
        'localhost:*',
        '127.0.0.1:*',
      ] : [
        ...nosecone.defaults.contentSecurityPolicy.directives.scriptSrc,
        'https://umami.claudepro.directory',
        'https://va.vercel-scripts.com',
        'https://vercel.live',
        'https://vitals.vercel-insights.com',
      ],

      // Style sources
      styleSrc: [
        ...nosecone.defaults.contentSecurityPolicy.directives.styleSrc,
        'https://fonts.googleapis.com',
      ],

      // Image sources - extend defaults to add GitHub
      imgSrc: [
        ...nosecone.defaults.contentSecurityPolicy.directives.imgSrc,
        'https://github.com',
        'https://*.githubusercontent.com',
        'https://claudepro.directory',
        'https://www.claudepro.directory',
      ],

      // Font sources - extend defaults to add Google Fonts
      fontSrc: [
        ...nosecone.defaults.contentSecurityPolicy.directives.fontSrc,
        'https://fonts.gstatic.com',
      ],

      // Connect sources (XHR, fetch, WebSocket, etc.)
      connectSrc: isDevelopment ? [
        ...nosecone.defaults.contentSecurityPolicy.directives.connectSrc,
        'https://umami.claudepro.directory',
        'https://vitals.vercel-insights.com',
        'https://va.vercel-scripts.com',
        'ws://localhost:*',
        'wss://localhost:*',
        'ws://127.0.0.1:*',
        'wss://127.0.0.1:*',
        'http://localhost:*',
        'https://localhost:*',
      ] : [
        ...nosecone.defaults.contentSecurityPolicy.directives.connectSrc,
        'https://umami.claudepro.directory',
        'https://vitals.vercel-insights.com',
        'https://va.vercel-scripts.com',
      ],

      // Frame ancestors - prevent clickjacking
      frameAncestors: ["'none'"],

      // Base URI
      baseUri: ["'self'"],

      // Form action
      formAction: ["'self'"],

      // Frame/child sources
      frameSrc: ["'none'"],
      childSrc: ["'none'"],

      // Media sources
      mediaSrc: ["'self'"],

      // Object sources - none for security
      objectSrc: ["'none'"],

      // Worker sources for service workers - extend defaults to add blob:
      workerSrc: [
        ...nosecone.defaults.contentSecurityPolicy.directives.workerSrc,
        'blob:',
      ],

      // Upgrade insecure requests in production
      upgradeInsecureRequests: isProduction,
    },
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
    console.error('Invalid pathname detected:', {
      pathname: sanitizePathForLogging(pathname),
      error: error instanceof z.ZodError ? error.issues : String(error),
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
          console.error('Invalid search query:', {
            pathname: sanitizePathForLogging(pathname),
            error: error instanceof z.ZodError ? error.issues : String(error),
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
      console.log('Validated request:', {
        method: requestValidation.method,
        path: sanitizePathForLogging(requestValidation.path),
        userAgent: requestValidation.userAgent?.slice(0, 50) + '...',
      });
    }
  } catch (error) {
    // Log validation error for monitoring
    console.error('Request validation failed:', {
      pathname: sanitizePathForLogging(pathname),
      method: request.method,
      error: error instanceof z.ZodError ? error.issues : String(error),
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
    console.error('Arcjet denied request:', {
      ip: decision.ip,
      path: sanitizePathForLogging(pathname),
      reason: decision.reason,
      conclusion: decision.conclusion,
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

  // Request allowed - add pathname header for SmartRelatedContent component
  const response = noseconeResponse;
  response.headers.set('x-pathname', pathname);
  return response;
}

// Remove the config export to run middleware on all routes
// This ensures security headers are applied to everything