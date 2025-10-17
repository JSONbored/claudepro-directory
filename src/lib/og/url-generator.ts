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
 * Standard social media dimensions (1200x630)
 */
export const OG_IMAGE_DIMENSIONS = {
  width: 1200,
  height: 630,
} as const;

/**
 * Generate OpenGraph image URL for any page path
 *
 * Returns the static WebP image optimized for social media sharing.
 * All routes use the same professionally designed brand image.
 *
 * @param path - The page path (ignored - all routes use same image)
 * @returns Full URL to the static OG image
 *
 * @example
 * ```ts
 * // Homepage
 * generateOGImageUrl('/');
 * // => "https://claudepro.directory/og-images/og-image.webp"
 *
 * // Content page (same image)
 * generateOGImageUrl('/agents/code-reviewer');
 * // => "https://claudepro.directory/og-images/og-image.webp"
 * ```
 */
export function generateOGImageUrl(_path: string): string {
  // Return static image URL - path parameter maintained for future dynamic generation
  return `${APP_CONFIG.url}/og-images/og-image.webp`;
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
