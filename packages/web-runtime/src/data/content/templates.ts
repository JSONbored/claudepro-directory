'use server';

import { type content_category } from '@heyclaude/data-layer/prisma';
import { type GetContentTemplatesReturns } from '@heyclaude/database-types/postgres-types';
import { serializeForClient } from '@heyclaude/shared-runtime';

import { createCachedDataFunction, generateResourceTags } from '../cached-data-factory.ts';

type ContentTemplatesResult = GetContentTemplatesReturns;
type ContentTemplateItem = NonNullable<NonNullable<ContentTemplatesResult['templates']>[number]>;

export type MergedTemplateItem = ContentTemplateItem &
  (ContentTemplateItem['template_data'] extends Record<string, unknown>
    ? ContentTemplateItem['template_data']
    : Record<string, unknown>) & {
    templateData: ContentTemplateItem['template_data'];
  };

/**
 * Get content templates
 * Uses 'use cache' to cache content templates. This data is public and same for all users.
 * Templates change periodically, so we use the 'medium' cacheLife profile.
 */
export const getContentTemplates = createCachedDataFunction<
  content_category,
  MergedTemplateItem[]
>({
  serviceKey: 'content',
  methodName: 'getContentTemplates',
  cacheMode: 'public',
  cacheLife: 'medium', // 1hr stale, 15min revalidate, 1 day expire
  cacheTags: (category) => generateResourceTags('templates', category),
  module: 'data/content/templates',
  operation: 'getContentTemplates',
  transformArgs: (category) => ({ p_category: category }),
  transformResult: (result) => {
    const templatesResult = result as GetContentTemplatesReturns;
    if (templatesResult === null || templatesResult === undefined) {
      return [];
    }

    const templates = templatesResult.templates?.filter(Boolean) ?? [];

    const merged = templates.map((template) => {
      const templateData = template.template_data;
      const mergedData =
        typeof templateData === 'object' && templateData !== null && !Array.isArray(templateData)
          ? templateData
          : {};
      return {
        ...template,
        ...mergedData,
        templateData: template.template_data,
      } as MergedTemplateItem;
    });

    // Serialize for Client Component compatibility - ensure all data is plain objects
    return serializeForClient(merged) as MergedTemplateItem[];
  },
  onError: () => [], // Return empty array on error to avoid breaking the build
});
