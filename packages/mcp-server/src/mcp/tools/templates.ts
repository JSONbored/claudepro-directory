/**
 * getTemplates Tool Handler
 *
 * Get submission templates for creating new content.
 * Uses ContentService.getContentTemplates.
 */

import { ContentService } from '@heyclaude/data-layer';
import type { GetTemplatesInput } from '../../lib/types.js';
import { normalizeError } from '@heyclaude/shared-runtime';
import type { ToolContext } from '../../types/runtime.js';

type TemplateField = { name: string; description?: string; type?: string };

/**
 * Fetches content submission templates from the database, normalizes their shape,
 * and returns a human-readable text summary together with structured template metadata.
 *
 * @param input - Input containing optional `category` to filter templates; when omitted the RPC defaults to `'agents'`
 * @param context - Tool handler context
 * @returns An object with:
 *  - `content`: an array containing a single text element with a header and per-template summary (name, category, description, and fields),
 *  - `_meta`: an object with `templates` (the normalized templates array) and `count` (number of templates).
 *          If no templates are found, `content` contains a friendly "no templates configured" message, `_meta.templates` is an empty array, and `count` is 0.
 */
export async function handleGetTemplates(
  input: GetTemplatesInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    templates: Array<{
      category: string;
      name: string;
      description: string;
      fields: TemplateField[];
      requiredFields: string[];
      examples: unknown[];
    }>;
    count: number;
  };
}> {
  const { prisma, logger } = context;
  const { category } = input;
  const startTime = Date.now();

  try {
    const contentService = new ContentService(prisma);

    // Get content templates using ContentService
    // Note: getContentTemplates accepts empty args (no p_category required)
    const data = await contentService.getContentTemplates({});

    // get_content_templates returns {templates: {...}} where templates is a JSON object
    // Extract the templates object
    const templatesData = (data as { templates?: unknown })?.templates || data || {};

    // Check if templates is an object or already an array
    let templatesArray: Array<Record<string, unknown>> = [];

    if (Array.isArray(templatesData)) {
      templatesArray = templatesData as Record<string, unknown>[];
    } else if (typeof templatesData === 'object' && templatesData !== null) {
      // Convert object to array of entries
      templatesArray = Object.entries(templatesData as Record<string, unknown>).map(
        ([key, value]: [string, unknown]) => ({
          category: key,
          ...(typeof value === 'object' && value !== null ? value : {}),
        })
      );
    }

    if (templatesArray.length === 0) {
      const categoryMsg = category ? ` for ${category}` : '';
      const duration = Date.now() - startTime;
      logger.info('getTemplates completed with no results', {
        tool: 'getTemplates',
        duration_ms: duration,
        category: category || 'agents',
        resultCount: 0,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: `No templates configured${categoryMsg}. Templates are used for content submission.`,
          },
        ],
        _meta: {
          templates: [],
          count: 0,
        },
      };
    }

    // Format templates
    const templates = templatesArray.map((template: Record<string, unknown>) => {
      return {
        category: typeof template['category'] === 'string' ? template['category'] : '',
        name:
          typeof template['template_name'] === 'string'
            ? template['template_name']
            : typeof template['name'] === 'string'
              ? template['name']
              : typeof template['category'] === 'string'
                ? template['category']
                : '',
        description:
          typeof template['description'] === 'string' ? template['description'] : '',
        fields: (Array.isArray(template['fields'])
          ? template['fields']
          : []) as TemplateField[],
        requiredFields: (Array.isArray(template['required_fields'])
          ? template['required_fields']
          : Array.isArray(template['requiredFields'])
            ? template['requiredFields']
            : []) as string[],
        examples: Array.isArray(template['examples']) ? template['examples'] : [],
      };
    });

    // Create text summary
    const textSummary = templates
      .map(
        (template: {
          name: string;
          category: string;
          description: string;
          fields: TemplateField[];
          requiredFields: string[];
        }) => {
          const fieldsText = template.fields
            .map((field: TemplateField) => {
              const required = template.requiredFields.includes(field.name)
                ? '(required)'
                : '(optional)';
              return `  - ${field.name} ${required}: ${field.description || field.type || ''}`;
            })
            .join('\n');

          return `## ${template.name} (${template.category})\n${template.description}\n\n### Fields:\n${fieldsText}`;
        }
      )
      .join('\n\n');

    const categoryDesc = category ? ` for ${category}` : ' for all categories';
    const duration = Date.now() - startTime;
    logger.info('getTemplates completed successfully', {
      tool: 'getTemplates',
      duration_ms: duration,
      category: category || 'agents',
      resultCount: templates.length,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Content Submission Templates${categoryDesc}:\n\n${textSummary}`,
        },
      ],
      _meta: {
        templates,
        count: templates.length,
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getTemplates tool failed');
    logger.error('getTemplates tool error', normalized, { tool: 'getTemplates', category });
    throw normalized;
  }
}
