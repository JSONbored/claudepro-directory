/**
 * OpenGraph Image URL Generator
 *
 * Generates URLs for the unified OG image API endpoint.
 * Used in metadata configuration across the application.
 *
 * @module lib/og/url-generator
 */

import { APP_CONFIG } from '@/src/lib/data/config/constants';

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
 * Returns the dynamic OG image from the edge function, which generates
 * images based on route metadata (title, description, category, tags).
 *
 * @param path - The page path (e.g., '/agents/code-reviewer' or '/')
 * @returns Full URL to the dynamic OG image edge function
 *
 * @example
 * ```ts
 * // Homepage
 * generateOGImageUrl('/');
 * // => "https://[project].supabase.co/functions/v1/og-image?route=/"
 *
 * // Content page
 * generateOGImageUrl('/agents/code-reviewer');
 * // => "https://[project].supabase.co/functions/v1/og-image?route=/agents/code-reviewer"
 * ```
 */
export function generateOGImageUrl(path: string): string {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  if (!supabaseUrl) {
    // Fallback to static image if Supabase URL is not available (e.g., during build)
    return `${APP_CONFIG.url}/og-images/og-image.webp`;
  }

  const route = encodeURIComponent(path || '/');
  return `${supabaseUrl}/functions/v1/og-image?route=${route}`;
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
        type: 'image/png', // Edge function returns PNG, not WebP
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
