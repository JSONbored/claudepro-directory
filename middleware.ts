import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Generate nonce for this request using Web Crypto API (Edge Runtime compatible)
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Create response with modified request
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Production CSP with strict security
  const isDevelopment = process.env.NODE_ENV === 'development';

  const cspDirectives = [
    "default-src 'self'",
    // Scripts: nonce-based for inline, specific domains for external
    `script-src 'self' 'nonce-${nonce}' https://umami.claudepro.directory https://va.vercel-scripts.com https://vercel.live https://vitals.vercel-insights.com${isDevelopment ? " 'unsafe-eval'" : ''}`,
    // Styles: nonce-based for inline, specific domains for external
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    // Fonts
    "font-src 'self' https://fonts.gstatic.com data:",
    // Images
    "img-src 'self' data: blob: https://github.com https://*.githubusercontent.com https://claudepro.directory https://www.claudepro.directory",
    // Connections (API, analytics, WebSocket for dev)
    `connect-src 'self' https://umami.claudepro.directory https://vitals.vercel-insights.com https://va.vercel-scripts.com${isDevelopment ? " ws://localhost:* wss://localhost:*" : ''}`,
    // Forms
    "form-action 'self'",
    // Frames
    "frame-ancestors 'none'",
    "frame-src 'none'",
    // Base
    "base-uri 'self'",
    // Objects
    "object-src 'none'",
    // Media
    "media-src 'self'",
    // Workers
    "worker-src 'self' blob:",
    // Manifest
    "manifest-src 'self'",
    // Upgrade insecure requests in production
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
    // Report violations to monitor CSP issues
    ...(process.env.CSP_REPORT_URI ? [`report-uri ${process.env.CSP_REPORT_URI}`] : [])
  ];

  const cspHeader = cspDirectives.join('; ');

  // Security headers following OWASP best practices
  const securityHeaders = {
    'Content-Security-Policy': cspHeader,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };

  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Set nonce for use in components
  response.headers.set('x-nonce', nonce);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt
     * - sitemap.xml
     * - manifest.json
     * - service-worker.js
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|service-worker.js|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)).*)',
  ],
};