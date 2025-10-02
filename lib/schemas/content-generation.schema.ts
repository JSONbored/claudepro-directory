/**
 * Content Generation Validation Schemas
 * Production-grade validation for build-time content generation
 * Ensures data integrity and security during static generation
 */

import { z } from 'zod';
import { nonNegativeInt } from '@/lib/schemas/primitives/base-numbers';
import { isoDatetimeString, nonEmptyString } from '@/lib/schemas/primitives/base-strings';
import { contentCategorySchema } from './shared.schema';

/**
 * Security constants for content generation
 */
const CONTENT_LIMITS = {
  MAX_SLUG_LENGTH: 200,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_CONTENT_LENGTH: 50000,
  MAX_TAG_LENGTH: 50,
  MAX_TAGS: 30,
  MAX_AUTHOR_LENGTH: 100,
  MAX_CONFIG_SIZE: 10000,
  MAX_ITEMS_PER_CATEGORY: 5000,
} as const;

/**
 * Base content schema for all content types
 */
export const baseContentSchema = z
  .object({
    id: nonEmptyString
      .max(CONTENT_LIMITS.MAX_SLUG_LENGTH)
      .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid ID format')
      .describe(
        'Unique identifier for the content item, alphanumeric with hyphens and underscores only'
      ),

    name: nonEmptyString
      .max(CONTENT_LIMITS.MAX_TITLE_LENGTH)
      .optional()
      .describe('Display name for the content item, used in listings and navigation'),

    title: nonEmptyString
      .max(CONTENT_LIMITS.MAX_TITLE_LENGTH)
      .optional()
      .describe('Primary title for the content item, used in headings and metadata'),

    slug: nonEmptyString
      .max(CONTENT_LIMITS.MAX_SLUG_LENGTH)
      .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid slug format')
      .optional()
      .describe(
        'URL-safe slug for routing and permalinks, alphanumeric with hyphens and underscores'
      ),

    description: nonEmptyString
      .max(CONTENT_LIMITS.MAX_DESCRIPTION_LENGTH)
      .describe('Detailed description of the content item, used for previews and SEO'),

    category: nonEmptyString.describe(
      'Content category classification for organization and filtering'
    ),

    author: nonEmptyString
      .max(CONTENT_LIMITS.MAX_AUTHOR_LENGTH)
      .regex(/^[a-zA-Z0-9\s\-_.@]+$/, 'Invalid author format')
      .describe('Content author name or identifier, alphanumeric with basic punctuation'),

    tags: z
      .array(
        nonEmptyString
          .max(CONTENT_LIMITS.MAX_TAG_LENGTH)
          .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid tag format')
          .describe('Individual tag for content classification and search')
      )
      .max(CONTENT_LIMITS.MAX_TAGS)
      .default([])
      .describe('Array of tags for content taxonomy and filtering, maximum 30 tags'),

    content: z
      .string()
      .max(CONTENT_LIMITS.MAX_CONTENT_LENGTH)
      .optional()
      .describe('Full content body in markdown or HTML format, up to 50,000 characters'),

    config: z
      .string()
      .max(CONTENT_LIMITS.MAX_CONFIG_SIZE)
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        // Validate it's valid JSON
        try {
          JSON.parse(val);
          return val;
        } catch {
          throw new Error('Invalid JSON in config field');
        }
      })
      .describe('JSON string configuration for legacy content, validated and transformed'),

    configuration: z
      .record(
        z.string().describe('Configuration key'),
        z
          .union([
            z.string().describe('String configuration value'),
            z.number().describe('Numeric configuration value'),
            z.boolean().describe('Boolean configuration value'),
            z
              .record(
                z.string().describe('Nested configuration key'),
                z
                  .union([
                    z.string().describe('Nested string value'),
                    z.number().describe('Nested numeric value'),
                    z.boolean().describe('Nested boolean value'),
                  ])
                  .describe('Nested configuration value supporting strings, numbers, and booleans')
              )
              .describe('Nested configuration object for complex settings'),
          ])
          .describe('Configuration value supporting multiple types and nested objects')
      )
      .optional()
      .describe('Structured configuration object for advanced content settings and metadata'),
  })
  .describe(
    'Base schema for all content types with core fields for identification, metadata, and configuration'
  );

/**
 * Generated content metadata (without heavy fields)
 */
export const generatedContentMetadataSchema = baseContentSchema
  .omit({
    content: true,
    config: true,
    configuration: true,
  })
  .describe(
    'Lightweight content metadata schema excluding heavy content and configuration fields for performance'
  );

/**
 * File loading result schema
 */
export const fileLoadResultSchema = z
  .object({
    filename: nonEmptyString.describe('Name of the file being loaded, with extension'),
    path: nonEmptyString.describe('Absolute or relative file path to the loaded content file'),
    content: baseContentSchema
      .nullable()
      .describe('Parsed and validated content data, null if loading or parsing failed'),
    error: z.string().optional().describe('Error message if file loading or validation failed'),
  })
  .describe('Result of loading and validating a single content file from the filesystem');

/**
 * Content collection schema
 */
export const contentCollectionSchema = z
  .object({
    category: contentCategorySchema.describe('Content category for this collection'),
    items: z
      .array(baseContentSchema)
      .max(CONTENT_LIMITS.MAX_ITEMS_PER_CATEGORY)
      .describe('Array of content items in this collection, maximum 5000 items'),
    count: nonNegativeInt.describe('Total number of items in this collection'),
  })
  .describe('Collection of content items grouped by category with count metadata');

/**
 * Build configuration schema
 */
export const buildConfigSchema = z
  .object({
    contentDir: nonEmptyString
      .refine((path) => !path.includes('..'), 'Path traversal detected')
      .describe(
        'Source directory containing raw content files, validated against path traversal attacks'
      ),

    generatedDir: nonEmptyString
      .refine((path) => !path.includes('..'), 'Path traversal detected')
      .describe(
        'Output directory for generated content files, validated against path traversal attacks'
      ),

    contentTypes: z
      .array(contentCategorySchema)
      .min(1)
      .describe('Array of content categories to process during build, at least one required'),

    generateTypeScript: z
      .boolean()
      .default(true)
      .describe('Whether to generate TypeScript type definition files'),
    generateIndex: z
      .boolean()
      .default(true)
      .describe('Whether to generate a unified index file for all content'),
    invalidateCaches: z
      .boolean()
      .default(true)
      .describe('Whether to invalidate Next.js caches after build completion'),
  })
  .describe('Configuration for content generation build process with security validations');

/**
 * Generated file info schema
 */
export const generatedFileSchema = z
  .object({
    path: nonEmptyString.describe('Absolute or relative path to the generated file'),
    type: z
      .enum(['metadata', 'full', 'index'])
      .describe('Type of generated file: metadata-only, full content, or index aggregation'),
    category: contentCategorySchema
      .optional()
      .describe('Content category for category-specific files, omitted for index files'),
    itemCount: nonNegativeInt.describe('Number of content items included in this generated file'),
    sizeBytes: nonNegativeInt.optional().describe('File size in bytes if available'),
    timestamp: isoDatetimeString.describe('ISO 8601 timestamp when the file was generated'),
  })
  .describe('Metadata about a single generated content file from the build process');

/**
 * Build result schema
 */
export const buildResultSchema = z
  .object({
    success: z.boolean().describe('Whether the build completed successfully without fatal errors'),
    contentStats: z
      .record(contentCategorySchema, nonNegativeInt)
      .describe('Count of content items generated per category'),
    generatedFiles: z
      .array(generatedFileSchema)
      .describe('Array of metadata for all files generated during the build'),
    indexItems: nonNegativeInt.describe(
      'Total number of items included in the generated index file'
    ),
    cacheInvalidated: z.boolean().describe('Whether Next.js caches were successfully invalidated'),
    duration: nonNegativeInt.describe('Build duration in milliseconds'),
    errors: z
      .array(z.string().describe('Individual error message'))
      .optional()
      .describe('Array of error messages if build encountered issues'),
  })
  .describe(
    'Complete result of content generation build process with statistics and error reporting'
  );

/**
 * JSON file validation result
 */
export const jsonFileValidationSchema = z
  .object({
    valid: z.boolean().describe('Whether the JSON file was successfully parsed and validated'),
    file: nonEmptyString.describe('Filename or path of the JSON file being validated'),
    data: baseContentSchema
      .optional()
      .describe('Parsed and validated content data if validation succeeded'),
    errors: z
      .array(z.string().describe('Individual validation error message'))
      .optional()
      .describe('Array of validation error messages if validation failed'),
  })
  .describe('Result of validating a JSON content file against the base content schema');

/**
 * Helper to process raw JSON content
 */
export function validateJsonContent(
  content: string,
  filename: string
): z.infer<typeof jsonFileValidationSchema> {
  try {
    const parsed = JSON.parse(content);
    const validated = baseContentSchema.parse(parsed);

    return {
      valid: true,
      file: filename,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        file: filename,
        errors: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      };
    }

    if (error instanceof SyntaxError) {
      return {
        valid: false,
        file: filename,
        errors: [`JSON parse error: ${error.message}`],
      };
    }

    return {
      valid: false,
      file: filename,
      errors: [String(error)],
    };
  }
}

/**
 * Helper to generate slug from filename
 */
export function generateSlugFromFilename(filename: string): string {
  return filename
    .replace(/\.json$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Type exports
 */
export type BaseContent = z.infer<typeof baseContentSchema>;
export type GeneratedContentMetadata = z.infer<typeof generatedContentMetadataSchema>;
export type FileLoadResult = z.infer<typeof fileLoadResultSchema>;
export type ContentCollection = z.infer<typeof contentCollectionSchema>;
export type BuildConfig = z.infer<typeof buildConfigSchema>;
export type GeneratedFile = z.infer<typeof generatedFileSchema>;
export type BuildResult = z.infer<typeof buildResultSchema>;
export type JsonFileValidation = z.infer<typeof jsonFileValidationSchema>;
