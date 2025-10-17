/**
 * Static OpenGraph Image Server
 *
 * Serves a single static OG image for all routes.
 * The image (og-image.webp) is a professionally designed 1200x630 WebP file
 * that represents the brand and is optimized for social media sharing.
 *
 * Features:
 * - Single static image for all pages (consistent branding)
 * - Aggressive CDN caching (30 days with stale-while-revalidate)
 * - Security validations (path traversal, format checks)
 * - Serving time: ~1-5ms (static file)
 *
 * Usage:
 * - /api/og?path=/ (serves og-image.webp)
 * - /api/og?path=/trending (serves og-image.webp)
 * - All paths return the same beautiful brand image
 *
 * @module api/og/route
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NextRequest } from 'next/server';
import { apiResponse, handleApiError } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';

// Route configuration
export const runtime = 'nodejs';
export const maxDuration = 10; // Static serving is fast

// Static OG image path
const OG_IMAGE_PATH = resolve(process.cwd(), 'public/og-images/og-image.webp');

/**
 * GET /api/og
 *
 * Serve static OpenGraph image for all routes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get path parameter (for logging/analytics, not used for routing)
    const path = searchParams.get('path') || '/';

    // Validate path format - must be a path, not a full URL
    if (!path.startsWith('/')) {
      return apiResponse.okRaw(
        { error: 'Invalid path. Path must start with forward slash.' },
        { status: 400, sMaxAge: 0, staleWhileRevalidate: 0 }
      );
    }

    // Security: Prevent path traversal
    if (path.includes('..')) {
      return apiResponse.okRaw(
        { error: 'Invalid path format.' },
        { status: 400, sMaxAge: 0, staleWhileRevalidate: 0 }
      );
    }

    // Load static OG image
    const buffer = readFileSync(OG_IMAGE_PATH);

    // Return image via unified response builder
    return apiResponse.raw(new Uint8Array(buffer), {
      contentType: 'image/webp',
      status: 200,
      headers: {
        'Content-Length': String(buffer.length),
        ETag: '"og-image-static"',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
      cache: { sMaxAge: 2592000, staleWhileRevalidate: 604800 }, // 30 days
    });
  } catch (error) {
    logger.error(
      'OG image serving failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        url: request.url,
      }
    );

    return handleApiError(error instanceof Error ? error : new Error(String(error)), {
      route: '/api/og',
      method: 'GET',
      operation: 'og_serving',
    });
  }
}
