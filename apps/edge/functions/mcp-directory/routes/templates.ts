/**
 * getTemplates Tool Handler
 *
 * Get submission templates for creating new content.
 * Uses the get_content_templates RPC.
 */

import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@heyclaude/shared-runtime';
import type { GetTemplatesInput } from '../lib/types.ts';

type ContentTemplatesItem = Database['public']['CompositeTypes']['content_templates_item'];
type TemplateField = { name: string; description?: string; type?: string };

/**
 * Fetches content submission templates from the database, normalizes their shape,
 * and returns a human-readable text summary together with structured template metadata.
 *
 * @param input - Input containing optional `category` to filter templates; when omitted the RPC defaults to `'agents'`
 * @returns An object with:
 *  - `content`: an array containing a single text element with a header and per-template summary (name, category, description, and fields),
 *  - `_meta`: an object with `templates` (the normalized templates array) and `count` (number of templates).
 *          If no templates are found, `content` contains a friendly "no templates configured" message, `_meta.templates` is an empty array, and `count` is 0.
 */
export async function handleGetTemplates(
  supabase: SupabaseClient<Database>,
  input: GetTemplatesInput
) {
  const { category } = input;

  // Call the RPC to get content templates
  // Note: get_content_templates requires p_category, so we use a default if not provided
  const rpcArgs = {
    p_category: category || 'agents', // Default to 'agents' if not provided
  };
  const { data, error } = await supabase.rpc('get_content_templates', rpcArgs);

  if (error) {
    // Use dbQuery serializer for consistent database query formatting
    await logError('RPC call failed in getTemplates', {
      dbQuery: {
        rpcName: 'get_content_templates',
        args: rpcArgs, // Will be redacted by Pino's redact config
      },
    }, error);
    throw new Error(`Failed to fetch templates: ${error.message}`);
  }

  // get_content_templates returns {templates: {...}} where templates is a JSON object
  // Extract the templates object
  const templatesData = data?.templates || data || {};

  // Check if templates is an object or already an array
  let templatesArray: Array<ContentTemplatesItem | Record<string, unknown>> = [];

  if (Array.isArray(templatesData)) {
    templatesArray = templatesData as ContentTemplatesItem[];
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
  const templates = templatesArray.map(
    (template: ContentTemplatesItem | Record<string, unknown>) => {
      const templateObj = template as Record<string, unknown>;
      return {
        category: typeof templateObj['category'] === 'string' ? templateObj['category'] : '',
        name:
          typeof templateObj['template_name'] === 'string'
            ? templateObj['template_name']
            : typeof templateObj['name'] === 'string'
              ? templateObj['name']
              : typeof templateObj['category'] === 'string'
                ? templateObj['category']
                : '',
        description:
          typeof templateObj['description'] === 'string' ? templateObj['description'] : '',
        fields: (Array.isArray(templateObj['fields'])
          ? templateObj['fields']
          : []) as TemplateField[],
        requiredFields: (Array.isArray(templateObj['required_fields'])
          ? templateObj['required_fields']
          : Array.isArray(templateObj['requiredFields'])
            ? templateObj['requiredFields']
            : []) as string[],
        examples: Array.isArray(templateObj['examples']) ? templateObj['examples'] : [],
      };
    }
  );

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
}