/**
 * OpenGraph Image URL Generator
 *
 * Generates URLs for the unified OG image API endpoint.
 * Used in metadata configuration across the application.
 */

import { APP_CONFIG } from '@heyclaude/shared-runtime';
// import { env } from '@heyclaude/shared-runtime/schemas/env'; // Reserved for future dynamic OG image generation

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
 * Returns the dynamic OG image from the Next.js API route, which generates
 * images based on route metadata (title, description, category, tags).
 * Falls back to static image if dynamic generation is unavailable.
 *
 * @param path - The page path (e.g., '/agents/code-reviewer' or '/')
 * @returns Full URL to the dynamic OG image API route or static fallback
 */
export function generateOGImageUrl(path: string): string {
  // Use Next.js API route for dynamic OG image generation
  // The /api/og route generates images on-demand with proper parameters
  const baseUrl = APP_CONFIG.url;
  
  // For now, use static image as primary (dynamic route can be enabled later)
  // TODO: Enable dynamic OG image generation once /api/og route is fully tested
  // When enabled, use path parameter to generate dynamic OG images:
  // const route = path || '/';
  // const encodedRoute = encodeURIComponent(route);
  // return `${baseUrl}/api/og?route=${encodedRoute}`;
  
  // Path parameter is part of the public API signature but currently unused
  // (reserved for future dynamic OG image generation)
  void path; // Mark as intentionally unused for now
  
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
        width: OG_IMAGE_DIMENSIONS.width,
        height: OG_IMAGE_DIMENSIONS.height,
        alt,
      },
    ],
  };
}
