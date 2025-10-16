/**
 * OpenGraph Image URL Generator
 *
 * Generates URLs for the unified OG image API endpoint.
 * Used in metadata configuration across the application.
 *
 * @module lib/og/url-generator
 */

import { APP_CONFIG } from '@/src/lib/constants';

/**
 * OpenGraph image dimensions
 */
export const OG_IMAGE_DIMENSIONS = {
  width: 1200,
  height: 630,
} as const;

/**
 * Generate OpenGraph image URL for any page path
 *
 * Serves pre-generated WebP images from build-time screenshot generation.
 * Images are created during build via `npm run generate:og-images`.
 *
 * @param path - The page path (e.g., "/trending", "/agents/code-reviewer")
 * @returns Full URL to the OG image API endpoint
 *
 * @example
 * ```ts
 * // Homepage
 * generateOGImageUrl('/');
 * // => "https://claudepro.directory/api/og?path=%2F"
 *
 * // Content page
 * generateOGImageUrl('/agents/code-reviewer');
 * // => "https://claudepro.directory/api/og?path=%2Fagents%2Fcode-reviewer"
 * ```
 */
export function generateOGImageUrl(path: string): string {
  // Build query params - only path is needed for static images
  const params = new URLSearchParams({
    path,
  });

  return `${APP_CONFIG.url}/api/og?${params.toString()}`;
}

/**
 * Generate OpenGraph metadata object for Next.js
 *
 * @param path - The page path
 * @param alt - Alt text for the image
 * @returns OpenGraph metadata object
 *
 * @example
 * ```ts
 * export const metadata = {
 *   openGraph: {
 *     ...generateOGMetadata('/trending', 'Trending Claude Configurations'),
 *   },
 * };
 * ```
 */
export function generateOGMetadata(path: string, alt: string) {
  return {
    images: [
      {
        url: generateOGImageUrl(path),
        width: OG_IMAGE_DIMENSIONS.width,
        height: OG_IMAGE_DIMENSIONS.height,
        alt,
        type: 'image/webp',
      },
    ],
  };
}

/**
 * Generate Twitter Card metadata object for Next.js
 *
 * @param path - The page path
 * @param alt - Alt text for the image
 * @returns Twitter card metadata object
 *
 * @example
 * ```ts
 * export const metadata = {
 *   twitter: {
 *     ...generateTwitterMetadata('/trending', 'Trending Claude Configurations'),
 *   },
 * };
 * ```
 */
export function generateTwitterMetadata(path: string, alt: string) {
  return {
    card: 'summary_large_image' as const,
    images: [
      {
        url: generateOGImageUrl(path),
        width: OG_IMAGE_DIMENSIONS.width,
        height: OG_IMAGE_DIMENSIONS.height,
        alt,
      },
    ],
  };
}
