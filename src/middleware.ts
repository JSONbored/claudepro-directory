import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isDevelopment } from '@/src/lib/env-client';
import { logger } from '@/src/lib/logger';

// Force Node.js runtime for middleware
export const runtime = 'nodejs';

/**
 * Sanitize path for logging - removes sensitive information
 */
function sanitizePathForLogging(path: string): string {
  return path
    .replace(/\/api\/[^/]*\/[a-f0-9-]{36}/g, '/api/*/[UUID]') // Replace UUIDs
    .replace(/\/api\/[^/]*\/\d+/g, '/api/*/[ID]') // Replace numeric IDs
    .replace(/\?.*$/g, '') // Remove query parameters
    .slice(0, 200); // Limit length for logging
}

/**
 * Simplified Middleware - Security with Cloudflare Enterprise
 *
 * Primary protection: Cloudflare Enterprise (WAF, bot detection, rate limiting, DDoS)
 * Middleware role: CVE mitigation + basic security headers
 *
 * Security headers are set in next.config.mjs for better performance
 */

export async function middleware(request: NextRequest) {
  const startTime = isDevelopment ? performance.now() : 0;
  const pathname = request.nextUrl.pathname;

  // CRITICAL SECURITY: CVE-2025-29927 mitigation - detect middleware bypass attempts
  const suspiciousHeaders = [
    'x-middleware-subrequest',
    'x-middleware-rewrite',
    'x-middleware-next',
    'x-middleware-invoke',
    'x-invoke-path',
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
          value: headerValue.substring(0, 100),
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

  // Create response with pathname header
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);

  // Add performance timing in development
  if (isDevelopment) {
    const duration = performance.now() - startTime;
    response.headers.set('X-Middleware-Duration', `${duration.toFixed(2)}ms`);
    logger.debug('Middleware execution', {
      path: sanitizePathForLogging(pathname),
      duration: `${duration.toFixed(2)}ms`,
    });
  }

  return response;
}

// Matcher configuration - exclude static assets
export const config = {
  matcher: [
    '/((?!_next/|_vercel/|favicon\\.ico|robots\\.txt|sitemap|manifest|service-worker|offline|/scripts/|/css/|/js/|\\.well-known/|863ad0a5c1124f59a060aa77f0861518\\.txt)(?!.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
