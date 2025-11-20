'use server';

import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import {
  FORM_FIELDS_CACHE_SECONDS,
  FORM_FIELDS_CACHE_TAG,
} from '@/src/lib/forms/submission-form-config.constants';
import { logger } from '@/src/lib/logger';
import type {
  FieldDefinition,
  NumberFieldDefinition,
  SelectFieldDefinition,
  SelectOption,
  SubmissionContentType,
  SubmissionFormConfig,
  SubmissionFormSection,
  TextareaFieldDefinition,
  TextFieldDefinition,
} from '@/src/lib/types/component.types';
import { SUBMISSION_CONTENT_TYPES } from '@/src/lib/types/component.types';
import type { Database } from '@/src/types/database.types';

type FormFieldConfigItem = Database['public']['CompositeTypes']['form_field_config_item'];

function mapField(item: FormFieldConfigItem): FieldDefinition | null {
  if (!(item.name && item.label && item.type)) {
    return null;
  }

  const base = {
    name: item.name,
    label: item.label,
    placeholder: item.placeholder ?? undefined,
    helpText: item.help_text ?? undefined,
    required: item.required ?? false,
    gridColumn: item.grid_column ?? 'full',
    iconName: item.icon_name ?? undefined,
    iconPosition: item.icon_position ?? undefined,
  };

  const fieldType = item.type;

  switch (fieldType) {
    case 'text':
      return {
        ...base,
        type: 'text' as const,
        defaultValue: item.default_value ?? undefined,
      } as TextFieldDefinition;

    case 'textarea':
      return {
        ...base,
        type: 'textarea' as const,
        rows: item.rows ?? undefined,
        monospace: item.monospace ?? false,
        defaultValue: item.default_value ?? undefined,
      } as TextareaFieldDefinition;

    case 'number':
      return {
        ...base,
        type: 'number' as const,
        min: item.min_value ?? undefined,
        max: item.max_value ?? undefined,
        step: item.step_value ?? undefined,
        defaultValue: item.default_value ?? undefined,
      } as NumberFieldDefinition;

    case 'select': {
      const options: SelectOption[] = [];
      if (item.select_options && Array.isArray(item.select_options)) {
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
              options.push({ value, label });
            }
          }
        }
      }
      return {
        ...base,
        type: 'select' as const,
        options,
        defaultValue: item.default_value ?? undefined,
      } as SelectFieldDefinition;
    }

    default:
      return null;
  }
}

function emptySection(): SubmissionFormSection {
  return {
    nameField: null,
    common: [],
    typeSpecific: [],
    tags: [],
  };
}

async function fetchFieldsForContentType(
  contentType: SubmissionContentType
): Promise<SubmissionFormSection> {
  const result = await fetchCachedRpc<
    'get_form_field_config',
    Database['public']['Functions']['get_form_field_config']['Returns'] | null
  >(
    { p_form_type: contentType },
    {
      rpcName: 'get_form_field_config',
      tags: ['templates', `submission-${contentType}`],
      ttlKey: 'cache.templates.ttl_seconds',
      keySuffix: contentType,
      fallback: null,
      logMeta: { contentType },
    }
  );

  if (!result?.fields) {
    logger.error('Failed to load form fields', new Error('RPC returned null or no fields'), {
      contentType,
      source: 'SubmissionFormConfig',
    });
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
      case 'common':
        section.common.push(field);
        break;
      case 'type_specific':
        section.typeSpecific.push(field);
        break;
      case 'tags':
        section.tags.push(field);
        break;
      default:
        section.common.push(field);
        break;
    }
  }

  return section;
}

async function loadSubmissionFormFields(): Promise<SubmissionFormConfig> {
  const entries = await Promise.all(
    SUBMISSION_CONTENT_TYPES.map(async (contentType) => {
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

export const getSubmissionFormFields = cache(async () => {
  return unstable_cache(loadSubmissionFormFields, ['submission-form-config'], {
    revalidate: FORM_FIELDS_CACHE_SECONDS,
    tags: [FORM_FIELDS_CACHE_TAG],
  })();
});
