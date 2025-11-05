/**
 * SEO Validation Schemas - Simplified
 * Minimal validation for metadata context
 */

import { z } from 'zod';
import type { ChangelogEntry } from '@/src/lib/changelog/loader';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { logger } from '@/src/lib/logger';
import type { Tables } from '@/src/types/database.types';

/**
 * Metadata Context Validation Schema
 * Validates the context object passed to metadata templates.
 */
export const metadataContextSchema = z
  .object({
    route: z.string().optional(),
    params: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
    item: z.custom<ContentItem | ChangelogEntry | Tables<'user_collections'>>().optional(),
    categoryConfig: z
      .object({
        title: z.string().optional(),
        pluralTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        keywords: z.string().optional(),
      })
      .catchall(z.unknown())
      .optional(),
    category: z.string().optional(),
    slug: z.string().optional(),
    profile: z.unknown().optional(),
    filters: z.record(z.string(), z.unknown()).optional(),
  })
  .catchall(z.unknown())
  .describe('Metadata generation context');

/**
 * Validate metadata context
 * Dev: throws on failure
 * Production: logs warning and returns null
 */
export function validateContext(
  context: unknown,
  source: string
): z.infer<typeof metadataContextSchema> | null {
  const result = metadataContextSchema.safeParse(context);

  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);

    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      throw new Error(
        `[${source}] Invalid MetadataContext:\n${errors.map((e) => `- ${e}`).join('\n')}`
      );
    }

    logger.warn(`[${source}] Invalid MetadataContext (using fallback)`, {
      source,
      errorCount: errors.length,
      errors: errors.join(' | ').slice(0, 500),
    });
    return null;
  }

  return result.data;
}
