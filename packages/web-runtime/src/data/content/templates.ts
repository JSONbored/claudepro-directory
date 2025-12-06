'use server';

import { ContentService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

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
 */
export async function getContentTemplates(
  category: Database['public']['Enums']['content_category']
): Promise<MergedTemplateItem[]> {
  'use cache';

  const { getCacheTtl } = await import('../../cache-config.ts');
  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger } = await import('../../logger.ts');
  const { generateRequestId } = await import('../../utils/request-id.ts');

  // Configure cache
  const ttl = getCacheTtl('cache.templates.ttl_seconds');
  cacheLife({ stale: ttl / 2, revalidate: ttl, expire: ttl * 2 });
  cacheTag('templates');
  cacheTag(`templates-${category}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getContentTemplates',
    module: 'data/content/templates',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new ContentService(client).getContentTemplates({ p_category: category });

    if (!result) {
      reqLogger.info('getContentTemplates: no templates found', {
        category,
      });
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

    reqLogger.info('getContentTemplates: fetched successfully', {
      category,
      count: merged.length,
    });

    return merged;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getContentTemplates: failed', errorForLogging, {
      category,
    });
    return [];
  }
}
