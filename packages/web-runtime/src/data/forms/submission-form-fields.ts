'use server';

import { type FormFieldConfigItem } from '@heyclaude/database-types/postgres-types';
import { cacheLife, cacheTag } from 'next/cache';

import {
  type FieldDefinition,
  type NumberFieldDefinition,
  type SelectFieldDefinition,
  type SelectOption,
  SUBMISSION_CONTENT_TYPES,
  type SubmissionContentType,
  type SubmissionFormConfig,
  type SubmissionFormSection,
  type TextareaFieldDefinition,
  type TextFieldDefinition,
} from '../../types/component.types.ts';
import { createCachedDataFunction, generateResourceTags } from '../cached-data-factory.ts';

const FORM_FIELDS_CACHE_TAG = 'submission-form-fields';
const FORM_FIELDS_CACHE_SECONDS = 60 * 60 * 6;

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

/**
 * Fetch fields for a content type (cached)
 * Uses 'use cache' to cache form field configuration. This data is public and same for all users.
 */
const fetchFieldsForContentType = createCachedDataFunction<
  SubmissionContentType,
  SubmissionFormSection
>({
  serviceKey: 'misc',
  methodName: 'getFormFieldConfig',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  cacheTags: (contentType) => generateResourceTags('forms', undefined, ['templates', `submission-${contentType}`]),
  module: 'data/forms/submission-form-fields',
  operation: 'fetchFieldsForContentType',
  transformArgs: (contentType) => ({ p_form_type: contentType }),
  transformResult: (result) => {
    const rpcResult = result as { fields: FormFieldConfigItem[] | null } | null;
    if (
      rpcResult === null ||
      rpcResult === undefined ||
      rpcResult.fields === null ||
      rpcResult.fields === undefined
    ) {
      return emptySection();
    }

    const section = emptySection();

    for (const item of rpcResult.fields) {
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

    return section;
  },
  onError: () => emptySection(),
  logContext: (contentType, result) => {
    const section = result as SubmissionFormSection | undefined;
    return {
      contentType,
      fieldCount:
        section
          ? section.common.length + section.typeSpecific.length + section.tags.length
          : 0,
    };
  },
});

async function loadSubmissionFormFields(): Promise<SubmissionFormConfig> {
  return fetchSubmissionSections(SUBMISSION_CONTENT_TYPES);
}

async function fetchSubmissionSections(
  types: readonly SubmissionContentType[]
): Promise<SubmissionFormConfig> {
  const entries = await Promise.all(
    types.map(async (contentType) => {
      const section = await fetchFieldsForContentType(contentType);
      return [contentType, section ?? emptySection()] as const;
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
