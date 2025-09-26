/**
 * Content Generation Validation Schemas
 * Production-grade validation for build-time content generation
 * Ensures data integrity and security during static generation
 */

import { z } from 'zod';
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
export const baseContentSchema = z.object({
  id: z
    .string()
    .min(1, 'ID is required')
    .max(CONTENT_LIMITS.MAX_SLUG_LENGTH)
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid ID format'),

  name: z.string().min(1).max(CONTENT_LIMITS.MAX_TITLE_LENGTH).optional(),

  title: z.string().min(1).max(CONTENT_LIMITS.MAX_TITLE_LENGTH).optional(),

  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(CONTENT_LIMITS.MAX_SLUG_LENGTH)
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid slug format')
    .optional(),

  description: z
    .string()
    .min(1, 'Description is required')
    .max(CONTENT_LIMITS.MAX_DESCRIPTION_LENGTH),

  category: z.string().min(1),

  author: z
    .string()
    .min(1, 'Author is required')
    .max(CONTENT_LIMITS.MAX_AUTHOR_LENGTH)
    .regex(/^[a-zA-Z0-9\s\-_.@]+$/, 'Invalid author format'),

  tags: z
    .array(
      z
        .string()
        .min(1)
        .max(CONTENT_LIMITS.MAX_TAG_LENGTH)
        .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid tag format')
    )
    .max(CONTENT_LIMITS.MAX_TAGS)
    .default([]),

  content: z.string().max(CONTENT_LIMITS.MAX_CONTENT_LENGTH).optional(),

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
    }),

  configuration: z
    .record(
      z.string(),
      z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
      ])
    )
    .optional(),
});

/**
 * Generated content metadata (without heavy fields)
 */
export const generatedContentMetadataSchema = baseContentSchema.omit({
  content: true,
  config: true,
  configuration: true,
});

/**
 * File loading result schema
 */
export const fileLoadResultSchema = z.object({
  filename: z.string(),
  path: z.string(),
  content: baseContentSchema.nullable(),
  error: z.string().optional(),
});

/**
 * Content collection schema
 */
export const contentCollectionSchema = z.object({
  category: contentCategorySchema,
  items: z.array(baseContentSchema).max(CONTENT_LIMITS.MAX_ITEMS_PER_CATEGORY),
  count: z.number().int().min(0),
});

/**
 * Build configuration schema
 */
export const buildConfigSchema = z.object({
  contentDir: z
    .string()
    .min(1)
    .refine((path) => !path.includes('..'), 'Path traversal detected'),

  generatedDir: z
    .string()
    .min(1)
    .refine((path) => !path.includes('..'), 'Path traversal detected'),

  contentTypes: z.array(contentCategorySchema).min(1),

  generateTypeScript: z.boolean().default(true),
  generateIndex: z.boolean().default(true),
  invalidateCaches: z.boolean().default(true),
});

/**
 * Generated file info schema
 */
export const generatedFileSchema = z.object({
  path: z.string(),
  type: z.enum(['metadata', 'full', 'index']),
  category: contentCategorySchema.optional(),
  itemCount: z.number().int().min(0),
  sizeBytes: z.number().int().min(0).optional(),
  timestamp: z.string().datetime(),
});

/**
 * Build result schema
 */
export const buildResultSchema = z.object({
  success: z.boolean(),
  contentStats: z.record(contentCategorySchema, z.number().int().min(0)),
  generatedFiles: z.array(generatedFileSchema),
  indexItems: z.number().int().min(0),
  cacheInvalidated: z.boolean(),
  duration: z.number().min(0),
  errors: z.array(z.string()).optional(),
});

/**
 * JSON file validation result
 */
export const jsonFileValidationSchema = z.object({
  valid: z.boolean(),
  file: z.string(),
  data: baseContentSchema.optional(),
  errors: z.array(z.string()).optional(),
});

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
 * Helper to convert slug to title
 */
export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
