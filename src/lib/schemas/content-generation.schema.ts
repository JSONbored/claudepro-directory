/**
 * Content Generation Validation Schemas
 * Production-grade validation for build-time content generation
 * Ensures data integrity and security during static generation
 *
 * SHA-2100: Removed 9 unused schemas/types (336 lines)
 * Only generateSlugFromFilename function is used in category-processor.ts
 */

/**
 * Helper to generate slug from filename
 */
export function generateSlugFromFilename(filename: string): string {
  return filename
    .replace(/\.json$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
