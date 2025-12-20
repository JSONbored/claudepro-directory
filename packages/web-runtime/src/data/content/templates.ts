import 'server-only';

import { type content_category } from '@prisma/client';
import { type ContentTemplatesResult } from '@heyclaude/data-layer';
import { serializeForClient } from '@heyclaude/shared-runtime';

import { createDataFunction } from '../cached-data-factory.ts';
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
export const getContentTemplates = createDataFunction<content_category, MergedTemplateItem[]>({
  methodName: 'getContentTemplates',
  module: 'data/content/templates',
  onError: () => [], // Return empty array on error to avoid breaking the build
  operation: 'getContentTemplates',
  serviceKey: 'content',
  transformArgs: (category) => ({ p_category: category }),
  transformResult: (result) => {
    const templatesResult = result as ContentTemplatesResult;
    if (templatesResult === null || templatesResult === undefined) {
      return [];
    }

    const templates = templatesResult.templates?.filter(Boolean) ?? [];

    const merged = templates.map(
      (template: NonNullable<ContentTemplatesResult['templates']>[number]) => {
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
      }
    );

    // Serialize for Client Component compatibility - ensure all data is plain objects
    return serializeForClient(merged);
  },
});
