/**
 * useTemplateApplication Hook
 *
 * Handles applying templates to the submission wizard form.
 * Parses template data and maps it to form fields intelligently.
 */

import { useCallback } from 'react';
import type { SubmissionContentType } from '@/src/lib/types/component.types';
import type { Database } from '@/src/types/database.types';

// Use generated type directly from database.types.ts
type ContentTemplatesResult = Database['public']['Functions']['get_content_templates']['Returns'];
type ContentTemplateItem = NonNullable<NonNullable<ContentTemplatesResult['templates']>[number]>;

// Type representing the merged structure (matches what getContentTemplates returns)
type MergedTemplateItem = ContentTemplateItem & {
  templateData: ContentTemplateItem['template_data'];
} & (ContentTemplateItem['template_data'] extends Record<string, unknown>
    ? ContentTemplateItem['template_data']
    : Record<string, unknown>);

interface FormData {
  submission_type: SubmissionContentType;
  name: string;
  description: string;
  author: string;
  author_profile_url?: string;
  github_url?: string;
  type_specific: Record<string, unknown>;
  tags: string[];
  examples: string[];
  category: string;
}

interface UseTemplateApplicationProps {
  onFormUpdate: (updates: Partial<FormData>) => void;
  currentFormData: FormData;
  onTrackEvent?: (event: string, data?: Record<string, unknown>) => void;
}

interface TemplateData {
  // Common fields
  name?: string;
  description?: string;
  tags?: string[];
  examples?: string[];

  // Type-specific fields
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  npm_package?: string;
  install_command?: string;
  tools_description?: string;
  rules_content?: string;
  command_content?: string;

  // Metadata
  usage_count?: number;
  trending?: boolean;
  featured?: boolean;

  [key: string]: unknown;
}

export function useTemplateApplication({
  onFormUpdate,
  currentFormData,
  onTrackEvent,
}: UseTemplateApplicationProps) {
  /**
   * Apply a template to the current form
   */
  const applyTemplate = useCallback(
    (template: MergedTemplateItem) => {
      try {
        // Parse template data
        const templateData = parseTemplateData(template.templateData);

        // Build form updates
        const updates: Partial<FormData> = {};

        // Map name (if not already filled)
        if (templateData.name && !currentFormData.name) {
          updates.name = templateData.name;
        }

        // Map description (if not already filled)
        if (templateData.description && !currentFormData.description) {
          updates.description = templateData.description;
        }

        // Map tags (merge with existing)
        if (templateData.tags && Array.isArray(templateData.tags)) {
          const existingTags = currentFormData.tags || [];
          const newTags = templateData.tags.filter((tag) => !existingTags.includes(tag));
          updates.tags = [...existingTags, ...newTags];
        }

        // Map examples (merge with existing)
        if (templateData.examples && Array.isArray(templateData.examples)) {
          const existingExamples = currentFormData.examples || [];
          const newExamples = templateData.examples.filter((ex) => !existingExamples.includes(ex));
          updates.examples = [...existingExamples, ...newExamples];
        }

        // Map type-specific fields based on content type
        const typeSpecific = mapTypeSpecificFields(currentFormData.submission_type, templateData);

        if (Object.keys(typeSpecific).length > 0) {
          updates.type_specific = {
            ...currentFormData.type_specific,
            ...typeSpecific,
          };
        }

        // Apply updates to form
        onFormUpdate(updates);

        // Track event
        if (onTrackEvent) {
          onTrackEvent('template_applied', {
            template_id: template.id,
            template_name: template.name,
            content_type: currentFormData.submission_type,
            fields_filled: Object.keys(updates).length,
          });
        }

        return true;
      } catch (error) {
        if (onTrackEvent) {
          onTrackEvent('template_apply_error', {
            template_id: template.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        return false;
      }
    },
    [currentFormData, onFormUpdate, onTrackEvent]
  );

  return { applyTemplate };
}

/**
 * Parse template data from JSON
 */
function parseTemplateData(data: unknown): TemplateData {
  if (!data) return {};

  try {
    // If it's already an object, return it
    if (typeof data === 'object' && data !== null) {
      return data as TemplateData;
    }

    // If it's a string, try to parse it
    if (typeof data === 'string') {
      return JSON.parse(data) as TemplateData;
    }

    return {};
  } catch (_error) {
    return {};
  }
}

/**
 * Map template data to type-specific fields based on content type
 */
function mapTypeSpecificFields(
  contentType: SubmissionContentType,
  templateData: TemplateData
): Record<string, unknown> {
  const typeSpecific: Record<string, unknown> = {};

  switch (contentType) {
    case 'agents':
      // Agent-specific fields
      if (templateData['system_prompt']) {
        typeSpecific['systemPrompt'] = templateData['system_prompt'];
      }
      if (templateData['temperature'] !== undefined) {
        typeSpecific['temperature'] = templateData['temperature'];
      }
      if (templateData['max_tokens'] !== undefined) {
        typeSpecific['maxTokens'] = templateData['max_tokens'];
      }
      break;

    case 'mcp':
      // MCP-specific fields
      if (templateData['npm_package']) {
        typeSpecific['npmPackage'] = templateData['npm_package'];
      }
      if (templateData['install_command']) {
        typeSpecific['installCommand'] = templateData['install_command'];
      }
      if (templateData['tools_description']) {
        typeSpecific['toolsDescription'] = templateData['tools_description'];
      }
      break;

    case 'rules':
      // Rules-specific fields
      if (templateData['rules_content']) {
        typeSpecific['rulesContent'] = templateData['rules_content'];
      }
      break;

    case 'commands':
      // Commands-specific fields
      if (templateData['command_content']) {
        typeSpecific['commandContent'] = templateData['command_content'];
      }
      break;

    case 'hooks':
    case 'statuslines':
    case 'skills':
      // Generic fields for other types
      // Can be extended based on specific needs
      break;

    default:
      // Handle unknown types gracefully
      break;
  }

  return typeSpecific;
}

/**
 * Extract preview text from template for display
 */
export function getTemplatePreview(template: MergedTemplateItem): string {
  try {
    const data = parseTemplateData(template.templateData);

    // Try to get the most relevant preview text
    if (data.system_prompt) {
      return data.system_prompt.slice(0, 150);
    }
    if (data.rules_content) {
      return data.rules_content.slice(0, 150);
    }
    if (data.command_content) {
      return data.command_content.slice(0, 150);
    }
    if (data.tools_description) {
      return data.tools_description.slice(0, 150);
    }

    // Fallback: return empty string if no preview text found
    return '';
  } catch {
    return '';
  }
}
