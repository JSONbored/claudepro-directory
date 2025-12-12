'use server';

import { MiscService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../../logger.ts';
import {
  type FieldDefinition,
  type NumberFieldDefinition,
  type SelectFieldDefinition,
  type SelectOption,
  type SubmissionContentType,
  type SubmissionFormConfig,
  type SubmissionFormSection,
  type TextareaFieldDefinition,
  type TextFieldDefinition,
} from '../../types/component.types.ts';

const SUBMISSION_CONTENT_TYPES = Constants.public.Enums
  .submission_type as readonly SubmissionContentType[];
const FORM_FIELDS_CACHE_TAG = 'submission-form-fields';
const FORM_FIELDS_CACHE_SECONDS = 60 * 60 * 6;

type FormFieldConfigItem = Database['public']['CompositeTypes']['form_field_config_item'];

function mapField(item: FormFieldConfigItem): FieldDefinition | null {
  if (!item.name || !item.label || !item.type) {
    return null;
  }

  const base = {
    gridColumn: item.grid_column ?? 'full',
    helpText: item.help_text ?? undefined,
    iconName: item.icon_name ?? undefined,
    iconPosition: item.icon_position ?? undefined,
    label: item.label,
    name: item.name,
    placeholder: item.placeholder ?? undefined,
    required: item.required ?? false,
  };

  const fieldType = item.type;

  switch (fieldType) {
    case 'number': {
      return {
        ...base,
        defaultValue:
          typeof item.default_value === 'number' ? (item.default_value as number) : undefined,
        max: item.max_value ?? undefined,
        min: item.min_value ?? undefined,
        step: item.step_value ?? undefined,
        type: 'number' as const,
      } as NumberFieldDefinition;
    }

    case 'select': {
      const options: SelectOption[] = [];
      if (Array.isArray(item.select_options) && item.select_options.length > 0) {
        for (const opt of item.select_options) {
          if (
            opt !== null &&
            typeof opt === 'object' &&
            !Array.isArray(opt) &&
            'value' in opt &&
            'label' in opt
          ) {
            const value = opt['value'];
            const label = opt['label'];
            if (typeof value === 'string' && typeof label === 'string') {
              options.push({ label, value });
            }
          }
        }
      }
      return {
        ...base,
        defaultValue: item.default_value ?? undefined,
        options,
        type: 'select' as const,
      } as SelectFieldDefinition;
    }

    case 'text': {
      return {
        ...base,
        defaultValue: item.default_value ?? undefined,
        type: 'text' as const,
      } as TextFieldDefinition;
    }

    case 'textarea': {
      return {
        ...base,
        defaultValue: item.default_value ?? undefined,
        monospace: item.monospace ?? false,
        rows: item.rows ?? undefined,
        type: 'textarea' as const,
      } as TextareaFieldDefinition;
    }

    default: {
      return null;
    }
  }
}

function emptySection(): SubmissionFormSection {
  return {
    common: [],
    nameField: null,
    tags: [],
    typeSpecific: [],
  };
}

/***
 * Fetch fields for a content type (cached)
 * Uses 'use cache' to cache form field configuration. This data is public and same for all users.
 * @param {SubmissionContentType} contentType
 
 * @returns {unknown} Description of return value*/
async function fetchFieldsForContentType(
  contentType: SubmissionContentType
): Promise<SubmissionFormSection> {
  'use cache';

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');

  // Configure cache - use 'hours' profile for form field templates (changes every 2 hours)
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  cacheTag('templates');
  cacheTag(`submission-${contentType}`);

  // Create request-scoped child logger to avoid race conditions
  const requestLogger = logger.child({
    module: 'data/forms/submission-form-fields',
    operation: 'fetchFieldsForContentType',
    route: 'utility-function', // Utility function - no specific route
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      // Admin client required during build: bypasses RLS for faster static generation
      // This is safe because build-time queries are read-only and don't expose user data
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new MiscService(client).getFormFieldConfig({ p_form_type: contentType });

    if (
      result === null ||
      result === undefined ||
      result.fields === null ||
      result.fields === undefined
    ) {
      // logger.error() normalizes errors internally, so pass raw error
      requestLogger.error(
        {
          contentType,
          err: new Error('RPC returned null or no fields'),
          source: 'SubmissionFormConfig',
        },
        'Failed to load form fields'
      );
      return emptySection();
    }

    const section = emptySection();

    for (const item of result.fields) {
      const field = mapField(item);
      if (!field) continue;

      if (item.field_group === 'common' && field.name === 'name' && field.type === 'text') {
        section.nameField = field;
        continue;
      }

      switch (item.field_group) {
        case 'common': {
          section.common.push(field);
          break;
        }
        case null: {
          // Handle null field_group - add to common by default
          section.common.push(field);
          break;
        }
        case 'tags': {
          section.tags.push(field);
          break;
        }
        case 'type_specific': {
          section.typeSpecific.push(field);
          break;
        }
        default: {
          section.common.push(field);
          break;
        }
      }
    }

    requestLogger.info(
      {
        contentType,
        fieldCount: section.common.length + section.typeSpecific.length + section.tags.length,
      },
      'fetchFieldsForContentType: fetched successfully'
    );

    return section;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    requestLogger.error(
      {
        contentType,
        err: errorForLogging,
        source: 'SubmissionFormConfig',
      },
      'fetchFieldsForContentType: failed'
    );
    return emptySection();
  }
}

async function loadSubmissionFormFields(): Promise<SubmissionFormConfig> {
  return fetchSubmissionSections(SUBMISSION_CONTENT_TYPES);
}

async function fetchSubmissionSections(
  types: readonly SubmissionContentType[]
): Promise<SubmissionFormConfig> {
  const entries = await Promise.all(
    types.map(async (contentType) => {
      const section = await fetchFieldsForContentType(contentType);
      return [contentType, section] as const;
    })
  );

  const config = {} as SubmissionFormConfig;
  for (const [contentType, section] of entries) {
    config[contentType] = section;
  }
  return config;
}

/**
 * Get submission form fields configuration
 *
 * Uses 'use cache' to cache form field configuration for 6 hours.
 * This data is public and same for all users, so it can be cached at build time.
 */
export async function getSubmissionFormFields(): Promise<SubmissionFormConfig> {
  'use cache';
  cacheLife({
    expire: FORM_FIELDS_CACHE_SECONDS * 2,
    revalidate: FORM_FIELDS_CACHE_SECONDS,
    stale: FORM_FIELDS_CACHE_SECONDS / 2,
  });
  cacheTag(FORM_FIELDS_CACHE_TAG);

  return loadSubmissionFormFields();
}
