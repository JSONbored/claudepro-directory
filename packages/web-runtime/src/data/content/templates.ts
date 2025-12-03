'use server';

import { ContentService } from '@heyclaude/data-layer';
import  { type Database } from '@heyclaude/database-types';

import { fetchCached } from '../../cache/fetch-cached.ts';

type ContentTemplatesResult = Database['public']['Functions']['get_content_templates']['Returns'];
type ContentTemplateItem = NonNullable<NonNullable<ContentTemplatesResult['templates']>[number]>;

type MergedTemplateItem = ContentTemplateItem & (ContentTemplateItem['template_data'] extends Record<string, unknown>
    ? ContentTemplateItem['template_data']
    : Record<string, unknown>) & {
  templateData: ContentTemplateItem['template_data'];
};

export async function getContentTemplates(
  category: Database['public']['Enums']['content_category']
): Promise<MergedTemplateItem[]> {
  const result = await fetchCached(
    (client) => new ContentService(client).getContentTemplates({ p_category: category }),
    {
      keyParts: ['content-templates', category],
      tags: ['templates', `templates-${category}`],
      ttlKey: 'templates',
      fallback: null,
      logMeta: { category },
    }
  );

  if (!result) {
    return [];
  }

  const templates =
    result.templates?.filter(Boolean) ?? [];

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
