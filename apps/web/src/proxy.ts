// Import directly from specific files to avoid pulling in pino via barrel exports
// The shared-runtime barrel exports schemas/env.ts which imports logger (pino)
import { getNodeEnv } from '@heyclaude/shared-runtime/env';
import { sanitizePathForLogging } from '@heyclaude/shared-runtime/proxy/guards';
import { applyNextProxyGuards, updateSupabaseSession } from '@heyclaude/web-runtime/server-edge';
import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PROXY_RATE_LIMIT = {
  maxRequests: 240,
  windowMs: 60 * 1000,
};

function shouldRateLimit(pathname: string): boolean {
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/auth/')) return true;
  if (pathname.startsWith('/account/')) return true;
  return false;
}

/**
 * Next.js 16 Proxy - CVE-2025-29927 mitigation and security headers
 *
 * Migrated from middleware.ts to proxy.ts per Next.js 16 requirements.
 * Proxy always runs on Node.js runtime (cannot be changed).
 * 
 * IMPORTANT: This file is NOT middleware - it's a proxy handler.
 * Netlify should not bundle this as an edge function.
 * Set NEXT_DISABLE_NETLIFY_EDGE=true in Netlify UI to disable edge function bundling.
 */

// Edge-safe: compute isDevelopment directly instead of importing from barrel
const isDevelopment = getNodeEnv() === 'development';

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const startTime = isDevelopment ? performance.now() : 0;
  const pathname = request.nextUrl.pathname;
  const guardResult = applyNextProxyGuards(request, {
    rateLimit: {
      config: PROXY_RATE_LIMIT,
      shouldApply: shouldRateLimit,
    },
    sanitizePath: sanitizePathForLogging,
  });

  if (guardResult.blockedResponse) {
    return guardResult.blockedResponse;
  }

  // Update Supabase Auth session (refresh tokens if needed)
  // This must happen early to ensure cookies are synced
  const authResponse = await updateSupabaseSession(request);

  // Use auth response if tokens were refreshed, otherwise create new response
  const response = authResponse ?? NextResponse.next();
  response.headers.set('x-pathname', pathname);

  // IMPORTANT: If authResponse was created, we must return it as-is to preserve
  // the refreshed auth cookies. Only modify headers, never recreate the response.

  if (guardResult.rateLimitResult) {
    const remaining = Math.max(guardResult.rateLimitResult.remaining, 0);
    response.headers.set('RateLimit-Limit', `${PROXY_RATE_LIMIT.maxRequests}`);
    response.headers.set('RateLimit-Remaining', `${remaining}`);
    response.headers.set(
      'RateLimit-Reset',
      `${Math.ceil(guardResult.rateLimitResult.resetAt / 1000)}`
    );
  }

  // Add performance timing in development
  // Note: Using console.log instead of logger to avoid pino dependency
  // which is Node.js-only and breaks edge function bundling
  if (isDevelopment) {
    const duration = performance.now() - startTime;
    response.headers.set('X-Middleware-Duration', `${duration.toFixed(2)}ms`);
    // Use console.log for development debugging (edge-compatible)
    console.log('[Proxy]', {
      path: sanitizePathForLogging(pathname),
      duration: `${duration.toFixed(2)}ms`,
    });
  }

  // Force env validation on every request in dev to catch issues early
  if (isDevelopment) {
    // Access NODE_ENV directly to ensure validation runs (edge-safe)
    void getNodeEnv();
  }

  return response;
}

export default proxy;

// Matcher configuration - exclude static assets
export const config = {
  matcher: [
    '/((?!_next/|_vercel/|favicon\\.ico|robots\\.txt|sitemap|manifest|service-worker|offline|/scripts/|/css/|/js/|\\.well-known/|863ad0a5c1124f59a060aa77f0861518\\.txt)(?!.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$).*)',
  ],
  // Note: Next.js 16 proxy always runs on Node.js runtime (cannot be changed)
  // The NEXT_DISABLE_NETLIFY_EDGE=true flag in netlify.toml should prevent edge bundling
};
