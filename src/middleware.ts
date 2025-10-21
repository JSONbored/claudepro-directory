/**
 * Ultra-Minimal Middleware - Security Essentials Only
 *
 * Core Functions:
 * 1. Arcjet (bot detection, WAF, rate limiting)
 * 2. Nosecone (security headers)
 * 3. CVE mitigation
 *
 * What's REMOVED (over-engineering):
 * - Custom endpoint rate limiters (Arcjet handles this)
 * - Fast-path checks (matcher config handles this)
 * - Nosecone header caching (premature optimization)
 * - Complex logging (console.error is enough)
 * - Request validation (belongs in API routes)
 */

import arcjet, { detectBot, shield, tokenBucket } from '@arcjet/next';
import * as nosecone from '@nosecone/next';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Inline env (no imports)
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const ARCJET_KEY = process.env.ARCJET_KEY || '';

// Validate Arcjet key
if (isProduction && !ARCJET_KEY) {
  throw new Error('ARCJET_KEY required in production');
}

// Arcjet: Bot detection + WAF + Rate limiting (all in one!)
const aj = arcjet({
  key: ARCJET_KEY || 'ak_dry_run_placeholder',
  rules: [
    shield({ mode: isDevelopment ? 'DRY_RUN' : 'LIVE' }),
    detectBot({
      mode: isDevelopment ? 'DRY_RUN' : 'LIVE',
      allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:MONITOR', 'CATEGORY:PREVIEW'],
    }),
    tokenBucket({
      mode: isDevelopment ? 'DRY_RUN' : 'LIVE',
      refillRate: 60,
      interval: 60,
      capacity: 120,
    }),
  ],
});

// Nosecone: Security headers (CSP, HSTS, etc.)
// Note: Using type assertion because Nosecone's strict types don't allow string literals
// Runtime: These are valid CSP sources that work correctly
const noseconeMiddleware = nosecone.createMiddleware({
  ...nosecone.defaults,
  contentSecurityPolicy: {
    directives: {
      ...nosecone.defaults.contentSecurityPolicy.directives,
      scriptSrc: [
        ...(nosecone.defaults.contentSecurityPolicy.directives.scriptSrc || []),
        "'strict-dynamic'" as any,
        'https://umami.claudepro.directory' as any,
        'https://*.vercel-scripts.com' as any,
        ...(isDevelopment ? ["'unsafe-eval'" as any] : []),
      ],
      upgradeInsecureRequests: isProduction,
    },
  },
});

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // CVE-2025-29927: Block suspicious headers
  const suspiciousHeaders = [
    'x-middleware-subrequest',
    'x-middleware-rewrite',
    'x-middleware-next',
    'x-middleware-invoke',
    'x-invoke-path',
    'x-vercel-invoke-path',
  ];

  for (const header of suspiciousHeaders) {
    if (request.headers.has(header)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // Run Arcjet and Nosecone in parallel
  const [arcjetResult, noseconeResult] = await Promise.allSettled([
    aj.protect(request, { requested: 1 }),
    noseconeMiddleware(),
  ]);

  // Fail-closed: Block if Arcjet fails
  if (arcjetResult.status === 'rejected') {
    return new NextResponse('Service Unavailable', { status: 503 });
  }

  // Get security headers (with fallback)
  const securityHeaders =
    noseconeResult.status === 'fulfilled'
      ? noseconeResult.value.headers
      : new Headers({ 'X-Content-Type-Options': 'nosniff' });

  // Check Arcjet decision
  const decision = arcjetResult.value;
  if (decision.isDenied()) {
    const status = decision.reason.isRateLimit() ? 429 : 403;
    return new NextResponse('Access Denied', { status, headers: securityHeaders });
  }

  // Allow request with security headers
  const response = NextResponse.next();
  securityHeaders.forEach((value, key) => response.headers.set(key, value));
  response.headers.set('x-pathname', pathname);

  return response;
}

// Matcher: Only run on routes that need protection
export const config = {
  matcher: [
    '/api/:path*',
    '/submit/:path*',
    '/account/:path*',
    '/tools/:path*',
    '/login',
    '/u/:path*',
    '/partner',
    '/community',
    '/for-you',
  ],
};
