import arcjet, { shield, detectBot, tokenBucket, fixedWindow } from '@arcjet/next';
import * as nosecone from '@nosecone/next';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiters } from '@/lib/rate-limiter';

// Initialize Arcjet with comprehensive security rules
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  // In development, Arcjet uses 127.0.0.1 when no real IP is available - this is expected
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

// Nosecone CSP configuration for security headers
const noseconeConfig: nosecone.NoseconeOptions = {
  ...nosecone.defaults,
  contentSecurityPolicy: {
    ...nosecone.defaults.contentSecurityPolicy,
    directives: {
      ...nosecone.defaults.contentSecurityPolicy.directives,
      scriptSrc: process.env.NODE_ENV === 'development' ? [
        "'self'",
        () => `'nonce-${Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64')}'`,
        'https://umami.claudepro.directory',
        'https://va.vercel-scripts.com',
        'https://vercel.live',
        'https://vitals.vercel-insights.com',
        "'sha256-E8EPi3ovz+EfxEviTr9UjHKYh5PnfxNoZOnJbyuXKOo='",
        "'sha256-o/9PMZ2H2soabInLejuhS90Bpzx18AfPQsGoMGCzsrc='",
        "'sha256-p31RDVXHOQSg6Q0CAI3TY0SBnMJNcC/Mfg32/43tAKQ='",
        'localhost:*',
        '127.0.0.1:*',
        'http://localhost:*',
        'https://localhost:*',
        'http://localhost:3000',
        'https://localhost:3000',
      ] : [
        "'self'",
        () => `'nonce-${Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64')}'`,
        'https://umami.claudepro.directory',
        'https://va.vercel-scripts.com',
        'https://vercel.live',
        'https://vitals.vercel-insights.com',
        "'sha256-E8EPi3ovz+EfxEviTr9UjHKYh5PnfxNoZOnJbyuXKOo='",
        "'sha256-o/9PMZ2H2soabInLejuhS90Bpzx18AfPQsGoMGCzsrc='",
        "'sha256-p31RDVXHOQSg6Q0CAI3TY0SBnMJNcC/Mfg32/43tAKQ='",
      ],
      styleSrc: process.env.NODE_ENV === 'development' ? [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'http://localhost:*',
        'https://localhost:*',
      ] : [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
      ],
      imgSrc: [
        "'self'",
        'blob:',
        'data:',
        'https://github.com',                    // GitHub avatars
        'https://*.githubusercontent.com',       // GitHub content
        'https://claudepro.directory',           // Our domain
        'https://www.claudepro.directory',       // Our www domain
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',             // Google Fonts
      ],
      connectSrc: process.env.NODE_ENV === 'development' ? [
        "'self'",
        'https://umami.claudepro.directory',     // Analytics API
        'https://vitals.vercel-insights.com',    // Vercel Analytics API
        'https://va.vercel-scripts.com',         // Vercel Scripts
        // Development mode WebSocket and HMR connections
        'ws://localhost:*',
        'wss://localhost:*',
        'ws://127.0.0.1:*',
        'wss://127.0.0.1:*',
        'http://localhost:*',
        'https://localhost:*',
      ] : [
        "'self'",
        'https://umami.claudepro.directory',     // Analytics API
        'https://vitals.vercel-insights.com',    // Vercel Analytics API
        'https://va.vercel-scripts.com',         // Vercel Scripts
      ],
      // Override frameSrc from 'none' to allow specific embeds if needed
      frameSrc: ["'none'"],
      // Service worker for PWA
      workerSrc: [
        "'self'",
        'blob:',
      ],
      // Manifest for PWA
      manifestSrc: ["'self'"],
      // Only upgrade to HTTPS in production
      upgradeInsecureRequests: process.env.NODE_ENV === 'production',
    },
  },
  // Disable COEP for compatibility with external resources
  crossOriginEmbedderPolicy: false,
  // Keep other defaults for security
  crossOriginOpenerPolicy: nosecone.defaults.crossOriginOpenerPolicy,
  crossOriginResourcePolicy: {
    policy: 'cross-origin', // Allow external resources (GitHub images, etc.)
  },
  originAgentCluster: nosecone.defaults.originAgentCluster,
  referrerPolicy: {
    policy: ['strict-origin-when-cross-origin'], // More permissive than 'no-referrer'
  },
  strictTransportSecurity: nosecone.defaults.strictTransportSecurity,
  xContentTypeOptions: nosecone.defaults.xContentTypeOptions,
  xDnsPrefetchControl: {
    allow: true, // Allow DNS prefetching for performance
  },
  xDownloadOptions: nosecone.defaults.xDownloadOptions,
  xFrameOptions: nosecone.defaults.xFrameOptions,
  xPermittedCrossDomainPolicies: nosecone.defaults.xPermittedCrossDomainPolicies,
  xXssProtection: nosecone.defaults.xXssProtection,
};

// Create the Nosecone middleware with Vercel toolbar support in preview
const noseconeMiddleware = nosecone.createMiddleware(
  process.env.VERCEL_ENV === 'preview'
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

  // Pattern-based matching for dynamic routes
  if (pathname.startsWith('/api/')) {
    // Admin and management endpoints
    if (pathname.includes('/admin') || pathname.includes('/manage') || pathname.includes('/warm')) {
      return rateLimiters.admin.middleware(request);
    }

    // Heavy data endpoints (bulk operations, large datasets)
    if (pathname.includes('/bulk') || pathname.includes('/export') || pathname.includes('/all-')) {
      return rateLimiters.heavyApi.middleware(request);
    }

    // Search-related endpoints (computationally expensive)
    if (pathname.includes('/search') || pathname.includes('/find') || pathname.includes('/query')) {
      return rateLimiters.search.middleware(request);
    }

    // Submit, creation, and modification operations
    if (
      request.method === 'POST' ||
      request.method === 'PUT' ||
      request.method === 'PATCH' ||
      request.method === 'DELETE' ||
      pathname.includes('/submit') ||
      pathname.includes('/upload') ||
      pathname.includes('/create') ||
      pathname.includes('/update') ||
      pathname.includes('/delete')
    ) {
      return rateLimiters.submit.middleware(request);
    }

    // Dynamic content type routes (e.g., /api/[contentType])
    if (pathname.match(/^\/api\/[^/]+\.json$/)) {
      return rateLimiters.api.middleware(request);
    }

    // Default API rate limiting for other API endpoints
    return rateLimiters.api.middleware(request);
  }

  // No specific rate limiting for non-API endpoints
  return null;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip Arcjet protection for static assets and Next.js internals
  const isStaticAsset =
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.json' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/service-worker.js' ||
    pathname === '/offline.html' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2');

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
      path: pathname,
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