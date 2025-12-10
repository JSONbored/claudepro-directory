/**
 * OpenGraph Image URL Generator
 *
 * Generates URLs for the static OG image.
 * Used in metadata configuration across the application.
 */

import { APP_CONFIG } from '@heyclaude/shared-runtime';

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
 * Returns the static OG image URL. Currently using a single static image
 * for all pages. The path parameter is accepted for API consistency but
 * is not used (reserved for future dynamic OG image generation if needed).
 *
 * @param path - The page path (e.g., '/agents/code-reviewer' or '/')
 * @returns Full URL to the static OG image
 */
export function generateOGImageUrl(path: string): string {
  const baseUrl = APP_CONFIG.url;
  
  // Path parameter is accepted for API consistency but currently unused
  // (reserved for future dynamic OG image generation if needed)
  void path;
  
  return `${baseUrl}/og-images/og-image.webp`;
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
