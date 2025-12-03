/**
 * OpenGraph Image URL Generator
 *
 * Generates URLs for the unified OG image API endpoint.
 * Used in metadata configuration across the application.
 */

import { env } from '@heyclaude/shared-runtime/schemas/env';
import { APP_CONFIG, OG_DIMENSIONS } from '@heyclaude/shared-runtime';

/**
 * Generate OpenGraph image URL for any page path
 *
 * Returns the dynamic OG image from the edge function, which generates
 * images based on route metadata (title, description, category, tags).
 *
 * @param path - The page path (e.g., '/agents/code-reviewer' or '/')
 * @returns Full URL to the dynamic OG image edge function
 */
export function generateOGImageUrl(path: string): string {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
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
 */
export function generateOGMetadata(path: string, alt: string) {
  return {
    images: [
      {
        url: generateOGImageUrl(path),
        width: OG_DIMENSIONS.width,
        height: OG_DIMENSIONS.height,
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
 */
export function generateTwitterMetadata(path: string, alt: string) {
  return {
    card: 'summary_large_image' as const,
    images: [
      {
        url: generateOGImageUrl(path),
        width: OG_DIMENSIONS.width,
        height: OG_DIMENSIONS.height,
        alt,
      },
    ],
  };
}
