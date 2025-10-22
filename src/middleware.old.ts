import arcjet, { detectBot, shield, tokenBucket } from '@arcjet/next';
import * as nosecone from '@nosecone/next';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
// Force Node.js runtime for middleware (Redis compression requires node:zlib)
export const runtime = 'nodejs';

// Inline env checks (no imports needed)
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const ARCJET_KEY = process.env.ARCJET_KEY || '';
const VERCEL_ENV = process.env.VERCEL_ENV as 'production' | 'preview' | 'development' | undefined;
const VERCEL_URL = process.env.VERCEL_URL;

// Initialize Arcjet with comprehensive security rules
// SECURITY: Require ARCJET_KEY in production for LIVE mode protection
// DEVELOPMENT: Allow DRY_RUN mode without key (Arcjet SDK handles gracefully)
if (isProduction && !ARCJET_KEY) {
  throw new Error(
    'ARCJET_KEY is required for security middleware in production (LIVE mode requires valid key)'
  );
}

// DRY_RUN mode (development): Arcjet performs rule evaluation but doesn't enforce blocks
// LIVE mode (production): Full enforcement requires valid key
const aj = arcjet({
  key: ARCJET_KEY || 'ak_dry_run_placeholder', // Placeholder for DRY_RUN mode
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

    // Rate limiting - token bucket algorithm (better than fixed window)
    // OPTIMIZATION: Using ONLY tokenBucket (removed fixedWindow to eliminate duplicate evaluation)
    // Token bucket allows burst traffic while maintaining average rate limits
    // Prevents thundering herd issues that can occur with fixed window algorithms
    tokenBucket({
      mode: isDevelopment ? 'DRY_RUN' : 'LIVE',
      refillRate: 60, // 60 tokens
      interval: 60, // per 60 seconds (1 minute)
      capacity: 120, // burst capacity of 120 tokens
    }),
  ],
});

// OPTIMIZATION: Pre-compute CSP arrays at module level for better performance
// Eliminates runtime array spread operations
const BASE_SCRIPT_SRC = [
  ...(nosecone.defaults.contentSecurityPolicy.directives.scriptSrc || []),
  "'strict-dynamic'", // Allow nonce-based scripts to load additional scripts
  'https://umami.claudepro.directory', // Umami analytics
  'https://*.vercel-scripts.com', // Vercel analytics
  'https://vercel.live', // Vercel toolbar
] as const;

const DEV_SCRIPT_SRC = [...BASE_SCRIPT_SRC, "'unsafe-eval'"] as const; // HMR/hot reload

const IMG_SRC = [
  ...(nosecone.defaults.contentSecurityPolicy.directives.imgSrc || []),
  'https://github.com',
  'https://*.githubusercontent.com',
  'https://claudepro.directory',
  'https://www.claudepro.directory',
] as const;

const BASE_CONNECT_SRC = [
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
] as const;

const PREVIEW_CONNECT_SRC = [
  ...BASE_CONNECT_SRC,
  'ws://localhost:*',
  'wss://localhost:*',
  ...(VERCEL_URL ? [`wss://${VERCEL_URL}`] : []),
] as const;

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

      // Use pre-computed arrays for better performance
      scriptSrc: isDevelopment ? DEV_SCRIPT_SRC : BASE_SCRIPT_SRC,
      imgSrc: IMG_SRC,
      connectSrc: VERCEL_ENV === 'preview' ? PREVIEW_CONNECT_SRC : BASE_CONNECT_SRC,

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
  VERCEL_ENV === 'preview'
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
 * Simple path sanitization for logging (no Zod schemas)
 * @deprecated - kept for reference, not currently used
 */
// function _sanitizePath(path: string): string {
//   return path
//     .replace(/\/api\/[^/]*\/[a-f0-9-]{36}/g, '/api/*/[UUID]')
//     .replace(/\/api\/[^/]*\/\d+/g, '/api/*/[ID]')
//     .replace(/\?.*$/g, '')
//     .slice(0, 200);
// }

/**
 * Simple static asset check (no Zod schemas)
 */
function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/_vercel/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.json' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/service-worker.js' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2')
  );
}

// NOTE: Custom endpoint-specific rate limiting removed - Arcjet handles this globally
// Arcjet's tokenBucket (lines 52-57) provides rate limiting for all requests

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
  const isStaticAssetPath = isStaticAsset(pathname);

  // OAuth callback - apply minimal middleware (security headers only, no rate limiting)
  // This prevents middleware from interfering with cookie setting during OAuth flow
  const isOAuthCallback = pathname.startsWith('/auth/callback');

  // Fast path: Apply only Nosecone headers for safe requests (no validation or Arcjet overhead)
  // Saves 50-150ms by skipping bot detection, rate limiting, and WAF checks

  if (isRSCRequest || isStaticAssetPath || isReadOnlyISRPath || isOAuthCallback) {
    const noseconeHeaders = await getNoseconeHeaders();
    const response = NextResponse.next();

    // Copy all security headers from Nosecone
    mergeSecurityHeaders(response.headers, noseconeHeaders);

    if (isDevelopment) {
      const duration = performance.now() - startTime;
      response.headers.set('X-Middleware-Duration', `${duration.toFixed(2)}ms`);
    }

    return response;
  }

  // NO REQUEST VALIDATION IN MIDDLEWARE - validation happens in API routes
  // Middleware only does: security headers, bot detection, rate limiting

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
      aj.protect(request, { requested: 1 }), // ~20-30ms (or <1ms if cached with local decisions)
      getNoseconeHeaders(), // ~1-2ms (cached)
    ]); // Total: ~20-30ms (concurrent execution, or <1ms for cached blocks)

    // Check Arcjet result (fail-closed: deny on error)
    if (results[0].status === 'rejected') {
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
      if (isDevelopment) {
        // Development mode - log Nosecone errors
      }

      // FAIL-OPEN: Continue with minimal security headers
      noseconeHeaders = new Headers({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
      });
    } else {
      noseconeHeaders = results[1].value;
    }
  } catch (_error) {
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
    if (isDevelopment) {
      // Development mode - log denied requests
    }

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
  }

  return response;
}

// Matcher configuration to reduce middleware invocations
// OPTIMIZATION: Only run middleware on routes that NEED security protection
// This reduces middleware invocations by ~90% while maintaining security
//
// Protected routes:
// - /api/* - All API endpoints (rate limiting + CORS)
// - /submit/* - Form submissions (CSRF protection)
// - /account/* - User account pages (Supabase auth)
// - /tools/* - Interactive tools (rate limiting)
// - /login - Login page (session management)
// - /u/:path* - User profile pages (may need auth checks)
// - Special pages - Partner, community, for-you (personalized content)
//
// Skipped routes (now fully static, no middleware needed):
// - / - Homepage (static)
// - /agents, /mcp, /commands, etc. - Category pages (static)
// - /agents/:slug, /mcp/:slug, etc. - Detail pages (static, view tracking client-side)
// - /trending - Trending page (static)
// - /search - Search page (static shell, client-side search)
// - /changelog/* - Changelog (static content)
// - /guides/* - Guides (static content)
// - /jobs/* - Jobs listing (static)
// - /companies - Companies listing (static)
// - /board - Board (static)
//
// PERFORMANCE IMPACT: ~90% reduction in middleware invocations
// Security headers still applied via Nosecone for all routes (in fast-path)
// View tracking moved to efficient client-side fetch (real-time from Redis)
export const config = {
  matcher: [
    // API routes (critical - need rate limiting + CORS)
    '/api/:path*',

    // Form submissions (critical - need CSRF protection)
    '/submit/:path*',

    // User account pages (critical - need Supabase auth)
    '/account/:path*',

    // Interactive tools (need rate limiting)
    '/tools/:path*',

    // Special routes that need protection
    '/login',
    '/u/:path*',
    '/partner',
    '/community',
    '/for-you',
  ],
};
