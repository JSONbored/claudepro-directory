'use server';

import { type content_category } from '@heyclaude/data-layer/prisma';
import { type Database } from '@heyclaude/database-types';
import { serializeForClient } from '@heyclaude/shared-runtime';
// Temporarily removed cache imports - will be re-added when caching is re-implemented
// import { cacheLife, cacheTag } from 'next/cache';

import { logger, normalizeError } from '../../logging/server.ts';

type ContentTemplatesResult = Database['public']['Functions']['get_content_templates']['Returns'];
type ContentTemplateItem = NonNullable<NonNullable<ContentTemplatesResult['templates']>[number]>;

type MergedTemplateItem = ContentTemplateItem &
  (ContentTemplateItem['template_data'] extends Record<string, unknown>
    ? ContentTemplateItem['template_data']
    : Record<string, unknown>) & {
    templateData: ContentTemplateItem['template_data'];
  };

/**
 * Get content templates
 * Uses 'use cache' to cache content templates. This data is public and same for all users.
 * Templates change periodically, so we use the 'hours' cacheLife profile.
 * @param category
 */
export async function getContentTemplates(
  category: content_category
): Promise<MergedTemplateItem[]> {
  // Temporarily removed 'use cache' to fix serialization issues during prerendering
  // The issue is that Next.js tries to serialize the entire function closure when using 'use cache',
  // and class instances (Supabase client, ContentService) created inside the function are being captured.

  // Configure cache - use 'hours' profile for templates (changes every 2 hours)
  // Note: cacheLife/cacheTag require 'use cache', so these are currently no-ops
  // cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  // cacheTag('templates');
  // cacheTag(`templates-${category}`);

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    module: 'data/content/templates',
    operation: 'getContentTemplates',
    route: 'utility-function', // Utility function - no specific route
  });

  try {
    // ContentService now uses Prisma (no constructor needed)
    const { ContentService } = await import('@heyclaude/data-layer');
    const result = await new ContentService().getContentTemplates({ p_category: category });

    if (result === null || result === undefined) {
      return [];
    }

    const templates = result.templates?.filter(Boolean) ?? [];

    const merged = templates.map((template) => {
      const templateData = template.template_data;
      const mergedData =
        typeof templateData === 'object' && templateData !== null && !Array.isArray(templateData)
          ? (templateData as Record<string, unknown>)
          : {};
      return {
        ...template,
        ...mergedData,
        templateData: template.template_data,
      } as MergedTemplateItem;
    });

    // Serialize for Client Component compatibility - ensure all data is plain objects
    // Uses standardized serializeForClient utility for consistent serialization
    // This handles Date objects, class instances, and any other non-serializable data
    const serialized = serializeForClient(merged);

    reqLogger.info(
      { category, templateCount: serialized.length },
      'getContentTemplates: fetched successfully'
    );

    return serialized;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to fetch content templates');
    reqLogger.error(
      { category, err: normalized, source: 'getContentTemplates' },
      'getContentTemplates: failed'
    );
    // Return empty array on error to avoid breaking the build
    return [];
  }
}
