
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
// Import directly from specific files to avoid pulling in pino via barrel exports
// The shared-runtime barrel exports schemas/env.ts which imports logger (pino)
import {
  checkRateLimit,
  type RateLimitConfig,
  type RateLimitResult,
} from '@heyclaude/shared-runtime/rate-limit';
import {
  detectSuspiciousHeaders,
  getClientInfo,
  sanitizePathForLogging,
  DEFAULT_SUSPICIOUS_HEADERS,
} from '@heyclaude/shared-runtime/proxy/guards';
import { normalizeErrorEdge as normalizeError } from '../errors-edge.ts';

// Use console directly instead of logger to avoid pulling in pino
// Proxy functions need to be lightweight and edge-compatible
// Logger is only used for development/debugging, console is sufficient
// IMPORTANT: Using normalizeErrorEdge (not errors.ts) to avoid pino dependency

export interface NextProxyRateLimitOptions {
  config: RateLimitConfig;
  shouldApply?: (pathname: string) => boolean;
}

export interface NextProxyGuardOptions {
  rateLimit?: NextProxyRateLimitOptions;
  suspiciousHeaders?: readonly string[];
  sanitizePath?: (path: string) => string;
}

export interface NextProxyGuardResult {
  blockedResponse?: NextResponse;
  rateLimitResult?: RateLimitResult | null;
}

export function applyNextProxyGuards(
  request: NextRequest,
  options: NextProxyGuardOptions = {}
): NextProxyGuardResult {
  const pathname = request.nextUrl.pathname;
  const sanitizePath = options.sanitizePath ?? sanitizePathForLogging;
  const suspiciousHeaders = detectSuspiciousHeaders(
    request,
    options.suspiciousHeaders ?? DEFAULT_SUSPICIOUS_HEADERS
  );

  if (suspiciousHeaders.length > 0) {
    const normalized = normalizeError(new Error('Suspicious header detected'));
    const clientInfo = getClientInfo(request);
    const sanitizedPath = sanitizePath(pathname);

    for (const { header, value } of suspiciousHeaders) {
      // Use console directly to avoid pulling in pino (edge-compatible)
      console.error('[CVE-2025-29927] Middleware bypass attempt detected', {
        err: normalized.message,
        header,
        value: value.substring(0, 100),
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        path: sanitizedPath,
        type: 'security_bypass_attempt',
        severity: 'critical',
        cve: 'CVE-2025-29927',
      });
    }

    const response = new NextResponse('Forbidden: Suspicious header detected', {
      status: 403,
      headers: {
        'X-Security-Event': 'CVE-2025-29927-BLOCKED',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'text/plain',
      },
    });

    return { blockedResponse: response };
  }

  let rateLimitResult: RateLimitResult | null = null;
  const rateLimitOptions = options.rateLimit;

  if (rateLimitOptions) {
    const shouldApply =
      !rateLimitOptions.shouldApply || rateLimitOptions.shouldApply(pathname);

    if (shouldApply) {
      rateLimitResult = checkRateLimit(request, rateLimitOptions.config);

      if (!rateLimitResult.allowed) {
        const sanitizedPath = sanitizePath(pathname);
        const clientInfo = getClientInfo(request);
        // Use console directly to avoid pulling in pino (edge-compatible)
        console.warn('[Proxy] Rate limit exceeded', {
          path: sanitizedPath,
          ip: clientInfo.ip,
          limit: rateLimitOptions.config.maxRequests,
          windowMs: rateLimitOptions.config.windowMs,
        });

        const retryAfter =
          rateLimitResult.retryAfter ??
          Math.ceil(rateLimitOptions.config.windowMs / 1000);

        const response = new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': `${retryAfter}`,
            'RateLimit-Limit': `${rateLimitOptions.config.maxRequests}`,
            'RateLimit-Remaining': '0',
            'RateLimit-Reset': `${Math.ceil(rateLimitResult.resetAt / 1000)}`,
          },
        });

        return { blockedResponse: response };
      }
    }
  }

  return { rateLimitResult };
}
