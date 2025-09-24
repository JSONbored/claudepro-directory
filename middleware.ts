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

  // Next.js specific style hashes for runtime injected styles
  const nextJsStyleHashes = [
    "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='", // Next.js empty style
    "'sha256-CIxDM5jnsGiKqXs2v7NKCY5MzdR9gu6TtiMJrDw29AY='", // Next.js runtime style
    "'sha256-skqujXORqzxt1aE0NNXxujEanPTX6raoqSscTV/Ww/Y='", // Next.js component style
  ];

  // Radix UI inline style hashes for production (calculated from actual runtime styles)
  const radixStyleHashes = [
    "'sha256-AbpHGcgLb+kRsJGnwFEktk7uzpZOCcBY74+YBdrKVGs='", // pointer-events:none (most common)
    "'sha256-2P5tqNMfs5TKPqg9LUKwLEJcNn8FwYwv3QxN4P4XGGc='", // Additional pointer-events variant
    "'sha256-O4zPQh/HKJJuz6eS8K3TL/dLBhgQv0L7D3awjHhXH3s='", // Radix select hidden styles
    "'sha256-jHboKxFKJvpJ1ZDh8pGLHWGVL8cOl7sYU5aVauh2qQ4='", // outline:none
    "'sha256-W9RKCa5I1VVD8vciQnk0UMJ7DQFmMWfHrRL9xqGQDL4='", // animation-duration:0s
  ];

  // Script hash for next-themes initialization (exact hash from production build)
  const themeScriptHash = "'sha256-FmalCxHzr5X6Vgb2BnZQ+H70HiNRZBDZliMdtxFMV8E='";

  const cspDirectives = [
    "default-src 'self'",
    // Scripts: nonce for inline, self for chunks, theme script hash, unsafe-eval only in dev for HMR
    `script-src 'self' 'nonce-${nonce}'${isDevelopment ? " 'unsafe-eval'" : ` ${themeScriptHash}`} https://umami.claudepro.directory https://va.vercel-scripts.com https://vercel.live https://vitals.vercel-insights.com`,
    `script-src-elem 'self' 'nonce-${nonce}'${!isDevelopment ? ` ${themeScriptHash}` : ''} https://umami.claudepro.directory https://va.vercel-scripts.com https://vercel.live https://vitals.vercel-insights.com`,
    // Styles: comprehensive coverage with hashes for Next.js runtime styles
    `style-src 'self' 'nonce-${nonce}' ${nextJsStyleHashes.join(' ')} https://fonts.googleapis.com`,
    `style-src-elem 'self' 'nonce-${nonce}' ${nextJsStyleHashes.join(' ')} https://fonts.googleapis.com`,
    // style-src-attr: only allow unsafe-inline in dev, production uses nonce + all necessary hashes
    `style-src-attr 'nonce-${nonce}'${isDevelopment ? " 'unsafe-inline'" : ` ${nextJsStyleHashes.join(' ')} ${radixStyleHashes.join(' ')}`}`,
    // Fonts
    "font-src 'self' https://fonts.gstatic.com data:",
    // Images
    "img-src 'self' data: blob: https://github.com https://*.githubusercontent.com https://claudepro.directory https://www.claudepro.directory",
    // Connections (API, analytics, WebSocket for dev)
    `connect-src 'self' https://umami.claudepro.directory https://vitals.vercel-insights.com https://va.vercel-scripts.com${isDevelopment ? " ws://localhost:* wss://localhost:* ws://*.local:*" : ''}`,
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