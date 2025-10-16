/**
 * Static OpenGraph Image Server
 *
 * Serves pre-generated OG images created at build time.
 * Images are real screenshots of pages generated via Playwright during build.
 *
 * Build-Time Generation:
 * - Real screenshots using Playwright (scripts/generate-og-images.ts)
 * - Sharp optimization (WebP, 85% quality, 1200x630)
 * - Incremental regeneration with SHA-256 caching
 * - Parallel processing (5 concurrent screenshots)
 *
 * Query Parameters:
 * - path: The page path (e.g., /trending, /agents/code-reviewer)
 *
 * Examples:
 * - /api/og?path=/trending
 * - /api/og?path=/agents/code-reviewer
 * - /api/og?path=/
 *
 * Performance:
 * - Serving time: ~1-5ms (static file)
 * - CDN cache: 30 days with stale-while-revalidate
 * - No runtime generation overhead
 *
 * Fallback Behavior:
 * - Returns default OG image if specific route image not found
 * - Logs missing images for future generation
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

// Paths configuration
const OG_IMAGES_DIR = resolve(process.cwd(), 'public/og-images');
const MANIFEST_PATH = resolve(OG_IMAGES_DIR, 'manifest.json');
const DEFAULT_IMAGE = resolve(OG_IMAGES_DIR, 'home.webp');

/**
 * Route manifest type
 */
interface RouteManifest {
  route: string;
  filename: string;
  hash: string;
  generatedAt: string;
  size: number;
}

/**
 * Load manifest (lazy-loaded and cached)
 */
let manifestCache: RouteManifest[] | null = null;
function loadManifest(): RouteManifest[] {
  if (manifestCache) return manifestCache;

  try {
    const data = readFileSync(MANIFEST_PATH, 'utf-8');
    manifestCache = JSON.parse(data);
    return manifestCache || [];
  } catch {
    logger.warn('OG image manifest not found - run npm run generate:og-images');
    return [];
  }
}

/**
 * Convert route path to filename
 */
function routeToFilename(route: string): string {
  return route === '/' ? 'home.webp' : `${route.replace(/^\//, '').replace(/\//g, '-')}.webp`;
}

/**
 * Get OG image for route
 * Returns pre-generated image or fallback to default
 */
function getOGImage(path: string): { buffer: Buffer; filename: string } {
  const manifest = loadManifest();

  // Find in manifest
  const entry = manifest.find((m) => m.route === path);
  const filename = entry?.filename || routeToFilename(path);
  const imagePath = resolve(OG_IMAGES_DIR, filename);

  try {
    const buffer = readFileSync(imagePath);
    return { buffer, filename };
  } catch {
    // Fallback to default image
    logger.info(`OG image not found for ${path}, using default`);

    try {
      const buffer = readFileSync(DEFAULT_IMAGE);
      return { buffer, filename: 'home.webp' };
    } catch {
      // No default image available
      throw new Error('No OG images available - run npm run generate:og-images');
    }
  }
}

/**
 * GET /api/og
 *
 * Serve pre-generated OpenGraph image for any page path
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get path parameter
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

    // Get pre-generated image
    const { buffer, filename } = getOGImage(path);

    // Return image via unified response builder
    return apiResponse.raw(new Uint8Array(buffer), {
      contentType: 'image/webp',
      status: 200,
      headers: {
        'Content-Length': String(buffer.length),
        ETag: `"og-${filename}"`,
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
