/**
 * Templates Data Layer - Database-First Architecture
 * Uses get_content_templates() RPC with edge-layer caching
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Database } from '@/src/types/database.types';

// Use generated type directly from database.types.ts
type ContentTemplatesResult = Database['public']['Functions']['get_content_templates']['Returns'];
type ContentTemplateItem = NonNullable<NonNullable<ContentTemplatesResult['templates']>[number]>;

// Type representing the merged structure (template_data fields at root level)
// This matches what the code expects - merged fields for backward compatibility
type MergedTemplateItem = ContentTemplateItem & {
  templateData: ContentTemplateItem['template_data'];
} & (ContentTemplateItem['template_data'] extends Record<string, unknown>
    ? ContentTemplateItem['template_data']
    : Record<string, unknown>);

export async function getContentTemplates(
  category: Database['public']['Enums']['content_category']
): Promise<MergedTemplateItem[]> {
  const result = await fetchCachedRpc<'get_content_templates', ContentTemplatesResult | null>(
    { p_category: category },
    {
      rpcName: 'get_content_templates',
      tags: ['templates', `templates-${category}`],
      ttlKey: 'cache.templates.ttl_seconds',
      keySuffix: category,
      useAuthClient: false,
      fallback: null,
      logMeta: { category },
    }
  );

  // Extract templates array from result, filtering out nulls and mapping to merged structure
  const templates =
    result?.templates?.filter((template): template is ContentTemplateItem => template !== null) ??
    [];

  // Map to merged structure (template_data fields at root, plus templateData alias)
  // This maintains backward compatibility with existing code that expects merged fields
  return templates.map((template) => {
    const templateData = template.template_data;
    const merged =
      typeof templateData === 'object' && templateData !== null && !Array.isArray(templateData)
        ? (templateData as Record<string, unknown>)
        : {};
    return {
      ...template,
      ...merged, // Merge template_data fields at root level
      templateData: template.template_data, // Add camelCase alias for templateData
    } as MergedTemplateItem;
  });
}
