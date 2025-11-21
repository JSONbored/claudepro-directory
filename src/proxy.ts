import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isDevelopment } from '@/src/lib/env-client';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

function sanitizePathForLogging(path: string): string {
  return path
    .replace(/\/api\/[^/]*\/[a-f0-9-]{36}/g, '/api/*/[UUID]')
    .replace(/\/api\/[^/]*\/\d+/g, '/api/*/[ID]')
    .replace(/\?.*$/g, '')
    .slice(0, 200);
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
      const normalized = normalizeError(
        'Suspicious header found',
        'CVE-2025-29927: Middleware bypass attempt detected'
      );
      logger.error('CVE-2025-29927: Middleware bypass attempt detected', normalized, {
        header: headerName,
        value: headerValue.substring(0, 100),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent')?.substring(0, 100) || 'unknown',
        path: sanitizePathForLogging(pathname),
        method: request.method,
        type: 'security_bypass_attempt',
        severity: 'critical',
        cve: 'CVE-2025-29927',
      });

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
    logger.debug('Proxy execution', {
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
