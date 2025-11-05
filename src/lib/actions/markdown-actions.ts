/**
 * Markdown Export Actions - Database-First Architecture
 * All logic in PostgreSQL via generate_markdown_export() RPC function
 */

'use server';

import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import { publicContentCategorySchema } from '@/src/lib/schemas/generated/db-schemas';
import { createClient } from '@/src/lib/supabase/server';
import { rateLimitedAction } from './safe-action';

const markdownExportSchema = z.object({
  category: publicContentCategorySchema,
  slug: z.string().min(1).max(200),
  includeMetadata: z.boolean().default(true),
  includeFooter: z.boolean().default(true),
});

export type MarkdownExportInput = z.infer<typeof markdownExportSchema>;

interface MarkdownExportResult {
  success: boolean;
  markdown?: string;
  filename?: string;
  length?: number;
  content_id?: string;
  error?: string;
}

export const copyMarkdownAction = rateLimitedAction
  .metadata({ actionName: 'copyMarkdown', category: 'content' })
  .schema(markdownExportSchema)
  .action(async ({ parsedInput: { category, slug, includeMetadata, includeFooter } }) => {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('generate_markdown_export', {
      p_category: category,
      p_slug: slug,
      p_include_metadata: includeMetadata,
      p_include_footer: includeFooter,
    });

    if (error) {
      logger.error('Markdown export RPC failed', error, { category, slug, source: 'copyMarkdown' });
      return { success: false, error: 'Failed to generate markdown content' };
    }

    return data as unknown as MarkdownExportResult;
  });

export const downloadMarkdownAction = rateLimitedAction
  .metadata({ actionName: 'downloadMarkdown', category: 'content' })
  .schema(markdownExportSchema.omit({ includeMetadata: true, includeFooter: true }))
  .action(async ({ parsedInput: { category, slug } }) => {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('generate_markdown_export', {
      p_category: category,
      p_slug: slug,
      p_include_metadata: true,
      p_include_footer: true,
    });

    if (error) {
      logger.error('Markdown export RPC failed', error, {
        category,
        slug,
        source: 'downloadMarkdown',
      });
      return { success: false, error: 'Failed to generate markdown content' };
    }

    return data as unknown as MarkdownExportResult;
  });
