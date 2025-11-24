import { env, isDevelopment } from '@heyclaude/shared-runtime';
import { sanitizePathForLogging } from '@heyclaude/shared-runtime/proxy/guards';
import { logger } from '@heyclaude/web-runtime/core';
import { evaluateFlags } from '@heyclaude/web-runtime/feature-flags/middleware';
import { applyNextProxyGuards } from '@heyclaude/web-runtime/server';
import type { NextRequest } from 'next/server';
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
 * Proxy runtime is nodejs (default) - does not support edge runtime.
 */

export async function proxy(request: NextRequest) {
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

  // Create response with pathname header
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);

  // Evaluate Feature Flags (PPR-Ready)
  // We intentionally do this after rate limiting to avoid cost on blocked requests
  try {
    const flags = await evaluateFlags(request);
    if (flags) {
      response.cookies.set('x-flags', flags, {
        httpOnly: false, // Allow client-side reading for Static Pages (ISR)
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
  } catch (error) {
    // Non-blocking error handling for flags
    logger.error('Middleware flag evaluation failed', error as Error);
  }

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
  if (isDevelopment) {
    const duration = performance.now() - startTime;
    response.headers.set('X-Middleware-Duration', `${duration.toFixed(2)}ms`);
    logger.debug('Proxy execution', {
      path: sanitizePathForLogging(pathname),
      duration: `${duration.toFixed(2)}ms`,
    });
  }

  // Force env validation on every request in dev to catch issues early
  if (isDevelopment) {
    // @ts-expect-error - Accessing property to ensure validation runs
    const _ = env.NODE_ENV;
  }

  return response;
}

export default proxy;

// Matcher configuration - exclude static assets
export const config = {
  matcher: [
    '/((?!_next/|_vercel/|favicon\\.ico|robots\\.txt|sitemap|manifest|service-worker|offline|/scripts/|/css/|/js/|\\.well-known/|863ad0a5c1124f59a060aa77f0861518\\.txt)(?!.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
