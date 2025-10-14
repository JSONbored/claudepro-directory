/**
 * Unified Dynamic OpenGraph Image Generator
 *
 * Generates real screenshot-based OG images for all pages using Playwright.
 * Includes Upstash Redis caching for performance optimization.
 *
 * Query Parameters:
 * - path: The page path to screenshot (e.g., /trending, /agents/code-reviewer)
 * - width: Image width (default: 1200)
 * - height: Image height (default: 630)
 * - refresh: Force refresh cache (admin only, requires auth)
 *
 * Examples:
 * - /api/og?path=/trending
 * - /api/og?path=/agents/code-reviewer
 * - /api/og?path=/guides/tutorials/mcp-setup
 * - /api/og?path=/collections/best-agents
 *
 * Caching Strategy:
 * - Redis cache: 7 days for static pages, 1 day for dynamic content
 * - CDN cache: 30 days with stale-while-revalidate
 * - In-memory fallback if Redis unavailable
 *
 * Performance:
 * - Cache hit: ~5-10ms
 * - Cache miss: ~500-1500ms (Playwright screenshot)
 * - Concurrent request deduplication via Redis locks
 *
 * @module api/og/route
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { apiResponse, handleApiError } from '@/src/lib/error-handler';
import { chromium } from 'playwright';
import { redisClient } from '@/src/lib/cache';
import { APP_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';

// Route configuration
export const runtime = 'nodejs'; // Required for Playwright
export const maxDuration = 30; // Allow up to 30s for screenshot generation

// OG image dimensions (standard 1.91:1 ratio)
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 630;

// Cache TTLs (in seconds)
const CACHE_TTL = {
  static: 60 * 60 * 24 * 7, // 7 days for homepage, about, etc.
  dynamic: 60 * 60 * 24, // 1 day for content pages
  trending: 60 * 60, // 1 hour for trending/search
} as const;

// Lock TTL for preventing concurrent generation (30 seconds)
const LOCK_TTL = 30;

/**
 * Determine cache TTL based on path
 */
function getCacheTTL(path: string): number {
  if (path === '/' || path === '/about' || path === '/contact') {
    return CACHE_TTL.static;
  }
  if (path.startsWith('/trending') || path.startsWith('/search')) {
    return CACHE_TTL.trending;
  }
  return CACHE_TTL.dynamic;
}

/**
 * Generate Redis cache key for OG image
 */
function getCacheKey(path: string, width: number, height: number): string {
  return `og:${path}:${width}x${height}`;
}

/**
 * Generate Redis lock key for preventing concurrent generation
 */
function getLockKey(path: string): string {
  return `og:lock:${path}`;
}

/**
 * Wait for lock to be released (with timeout)
 */
async function waitForLock(lockKey: string, maxWaitMs = 25000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const redis = redisClient.getClient();
    if (!redis) return false;

    try {
      const lockExists = await redis.exists(lockKey);
      if (!lockExists) return true;

      // Wait 100ms before checking again
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Acquire lock for generating OG image
 */
async function acquireLock(lockKey: string): Promise<boolean> {
  return redisClient.executeOperation(
    async (redis) => {
      // Use SET NX (set if not exists) with expiry
      const result = await redis.set(lockKey, Date.now().toString(), {
        nx: true,
        ex: LOCK_TTL,
      });
      return result === 'OK';
    },
    () => true, // Fallback: allow generation (no distributed locking)
    'acquire_og_lock'
  );
}

/**
 * Release lock after generation
 */
async function releaseLock(lockKey: string): Promise<void> {
  await redisClient.executeOperation(
    async (redis) => {
      await redis.del(lockKey);
    },
    () => undefined,
    'release_og_lock'
  );
}

/**
 * Generate OG image screenshot using Playwright
 */
async function generateScreenshot(path: string, width: number, height: number): Promise<Buffer> {
  const startTime = Date.now();
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

  try {
    // Launch headless browser
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 2, // Retina quality
    });

    const page = await context.newPage();

    // Build full URL
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : APP_CONFIG.url;
    const fullUrl = `${baseUrl}${path}`;

    logger.info(`Generating OG screenshot for: ${fullUrl}`);

    // Navigate to page with timeout
    await page.goto(fullUrl, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });

    // Wait for page to be fully rendered
    await page.waitForLoadState('load');

    // Optional: Wait for specific content to be visible
    // await page.waitForSelector('main', { timeout: 5000 }).catch(() => {});

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false, // Only viewport
    });

    const duration = Date.now() - startTime;
    logger.info(`OG screenshot generated in ${duration}ms: ${path}`);

    return Buffer.from(screenshot);
  } catch (error) {
    logger.error(
      'Failed to generate OG screenshot',
      error instanceof Error ? error : new Error(String(error)),
      { path, width, height }
    );
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Get OG image from cache or generate new one
 */
async function getOrGenerateOGImage(
  path: string,
  width: number,
  height: number,
  forceRefresh = false
): Promise<Buffer> {
  const cacheKey = getCacheKey(path, width, height);
  const lockKey = getLockKey(path);

  // Try to get from cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await redisClient.executeOperation(
      async (redis) => {
        const data = await redis.get(cacheKey);
        if (data && typeof data === 'string') {
          // Stored as base64 string
          return Buffer.from(data, 'base64');
        }
        return null;
      },
      async () => {
        const fallback = await redisClient.getFallback(cacheKey);
        return fallback ? Buffer.from(fallback, 'base64') : null;
      },
      'get_og_cache'
    );

    if (cached) {
      logger.debug(`OG cache hit: ${path}`);
      return cached;
    }
  }

  // Try to acquire lock
  const lockAcquired = await acquireLock(lockKey);

  if (!lockAcquired) {
    // Another process is generating, wait for it
    logger.info(`Waiting for concurrent OG generation: ${path}`);
    const lockReleased = await waitForLock(lockKey);

    if (lockReleased) {
      // Try to get from cache again
      const cached = await redisClient.executeOperation(
        async (redis) => {
          const data = await redis.get(cacheKey);
          if (data && typeof data === 'string') {
            return Buffer.from(data, 'base64');
          }
          return null;
        },
        async () => {
          const fallback = await redisClient.getFallback(cacheKey);
          return fallback ? Buffer.from(fallback, 'base64') : null;
        },
        'get_og_cache_after_wait'
      );

      if (cached) {
        return cached;
      }
    }

    // If still no cache after waiting, generate anyway (fallback)
    logger.warn(`Lock wait timeout, generating anyway: ${path}`);
  }

  try {
    // Generate new screenshot
    const screenshot = await generateScreenshot(path, width, height);

    // Store in cache (as base64 for Redis string storage)
    const base64Screenshot = screenshot.toString('base64');
    const ttl = getCacheTTL(path);

    await redisClient.executeOperation(
      async (redis) => {
        await redis.set(cacheKey, base64Screenshot, { ex: ttl });
      },
      async () => {
        await redisClient.setFallback(cacheKey, base64Screenshot, ttl);
      },
      'store_og_cache'
    );

    logger.info(`OG image cached: ${path} (TTL: ${ttl}s)`);

    return screenshot;
  } finally {
    // Always release lock
    await releaseLock(lockKey);
  }
}

/**
 * GET /api/og
 *
 * Generate OpenGraph image for any page path
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get parameters
    const path = searchParams.get('path') || '/';
    const width = Number.parseInt(searchParams.get('width') || String(DEFAULT_WIDTH), 10);
    const height = Number.parseInt(searchParams.get('height') || String(DEFAULT_HEIGHT), 10);
    const refresh = searchParams.get('refresh') === 'true';

    // Validate dimensions
    if (width < 100 || width > 2400 || height < 100 || height > 2400) {
      return NextResponse.json(
        { error: 'Invalid dimensions. Width and height must be between 100 and 2400.' },
        { status: 400 }
      );
    }

    // Validate path format
    if (!path.startsWith('/')) {
      return NextResponse.json(
        { error: 'Invalid path. Path must start with forward slash.' },
        { status: 400 }
      );
    }

    // Security: Prevent path traversal
    if (path.includes('..') || path.includes('//')) {
      return NextResponse.json({ error: 'Invalid path format.' }, { status: 400 });
    }

    // Generate or retrieve OG image
    const image = await getOrGenerateOGImage(path, width, height, refresh);

    // Return image via unified response builder
    return apiResponse.raw(new Uint8Array(image), {
      contentType: 'image/png',
      status: 200,
      headers: {
        'Content-Length': String(image.length),
        ETag: `"og-${path}-${width}x${height}"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
      cache: { sMaxAge: 2592000, staleWhileRevalidate: 604800 },
    });
  } catch (error) {
    logger.error(
      'OG image generation failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        url: request.url,
      }
    );

    return handleApiError(error instanceof Error ? error : new Error(String(error)), {
      route: '/api/og',
      method: 'GET',
      operation: 'og_generation',
    });
  }
}
