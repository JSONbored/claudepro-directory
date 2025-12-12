/**
 * Platform Detection Utility
 * 
 * Provides platform-agnostic detection for deployment environments.
 * Supports: Vercel, Netlify, Cloudflare Pages, AWS Amplify, Railway, Render, and others.
 * 
 * @module platform/detection
 */

/**
 * Supported deployment platforms
 */
export type Platform =
  | 'vercel'
  | 'netlify'
  | 'cloudflare'
  | 'aws'
  | 'railway'
  | 'render'
  | 'unknown';

/**
 * Detects the current deployment platform based on environment variables.
 * 
 * Platform detection priority:
 * 1. Explicit DEPLOYMENT_PLATFORM env var (highest priority)
 * 2. Platform-specific environment variables
 * 3. Unknown (fallback)
 * 
 * @returns The detected platform identifier
 * 
 * @example
 * ```ts
 * const platform = detectPlatform();
 * if (platform === 'vercel') {
 *   // Vercel-specific logic
 * }
 * ```
 */
export function detectPlatform(): Platform {
  // Check for explicit platform setting (highest priority)
  if (typeof process !== 'undefined' && process.env) {
    const explicitPlatform = process.env['DEPLOYMENT_PLATFORM'];
    if (explicitPlatform) {
      const normalized = explicitPlatform.toLowerCase().trim();
      if (
        normalized === 'vercel' ||
        normalized === 'netlify' ||
        normalized === 'cloudflare' ||
        normalized === 'aws' ||
        normalized === 'railway' ||
        normalized === 'render'
      ) {
        return normalized as Platform;
      }
    }

    // Vercel detection
    if (process.env['VERCEL'] === '1' || process.env['VERCEL_ENV'] || process.env['VERCEL_URL']) {
      return 'vercel';
    }

    // Netlify detection
    if (process.env['NETLIFY'] === 'true' || process.env['NETLIFY_URL']) {
      return 'netlify';
    }

    // Cloudflare Pages detection
    if (process.env['CF_PAGES'] || process.env['CF_PAGES_URL']) {
      return 'cloudflare';
    }

    // AWS Amplify/Lambda detection
    if (
      process.env['AWS_LAMBDA_FUNCTION_NAME'] ||
      process.env['AWS_EXECUTION_ENV'] ||
      process.env['AWS_REGION']
    ) {
      return 'aws';
    }

    // Railway detection
    if (process.env['RAILWAY_ENVIRONMENT'] || process.env['RAILWAY_ENVIRONMENT_ID']) {
      return 'railway';
    }

    // Render detection
    if (process.env['RENDER'] || process.env['RENDER_SERVICE_ID']) {
      return 'render';
    }
  }

  return 'unknown';
}

/**
 * Checks if the current platform is a specific platform.
 * 
 * @param platform - The platform to check for
 * @returns True if the current platform matches
 * 
 * @example
 * ```ts
 * if (isPlatform('vercel')) {
 *   // Vercel-specific code
 * }
 * ```
 */
export function isPlatform(platform: Platform): boolean {
  return detectPlatform() === platform;
}

/**
 * Checks if the current platform is Vercel.
 * 
 * @returns True if running on Vercel
 */
export function isVercel(): boolean {
  return isPlatform('vercel');
}

/**
 * Checks if the current platform is Netlify.
 * 
 * @returns True if running on Netlify
 */
export function isNetlify(): boolean {
  return isPlatform('netlify');
}

/**
 * Checks if the current platform is Cloudflare Pages.
 * 
 * @returns True if running on Cloudflare Pages
 */
export function isCloudflare(): boolean {
  return isPlatform('cloudflare');
}
