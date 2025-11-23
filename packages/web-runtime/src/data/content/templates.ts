'use server';

import type { Database } from '@heyclaude/database-types';
import { fetchCached } from '../../cache/fetch-cached.ts';
import { ContentService } from '@heyclaude/data-layer';

type ContentTemplatesResult = Database['public']['Functions']['get_content_templates']['Returns'];
type ContentTemplateItem = NonNullable<NonNullable<ContentTemplatesResult['templates']>[number]>;

type MergedTemplateItem = ContentTemplateItem & {
  templateData: ContentTemplateItem['template_data'];
} & (ContentTemplateItem['template_data'] extends Record<string, unknown>
    ? ContentTemplateItem['template_data']
    : Record<string, unknown>);

export async function getContentTemplates(
  category: Database['public']['Enums']['content_category']
): Promise<MergedTemplateItem[]> {
  const result = await fetchCached(
    (client) => new ContentService(client).getContentTemplates(category),
    {
      key: category,
      tags: ['templates', `templates-${category}`],
      ttlKey: 'cache.templates.ttl_seconds',
      fallback: null,
      logMeta: { category },
    }
  );

  const templates =
    result?.templates?.filter((template): template is ContentTemplateItem => template !== null) ??
    [];

  return templates.map((template) => {
    const templateData = template.template_data;
    const merged =
      typeof templateData === 'object' && templateData !== null && !Array.isArray(templateData)
        ? (templateData as Record<string, unknown>)
        : {};
    return {
      ...template,
      ...merged,
      templateData: template.template_data,
    } as MergedTemplateItem;
  });
}
