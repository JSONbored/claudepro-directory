'use server';

import { MiscService } from '@heyclaude/data-layer';
import  { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';

import { fetchCached } from '../../cache/fetch-cached.ts';
import { normalizeError } from '../../errors.ts';
import { logger } from '../../logger.ts';
import  {
  type SubmissionContentType,
  type SubmissionFormConfig,
  type SubmissionFormSection,
  type FieldDefinition,
  type TextFieldDefinition,
  type TextareaFieldDefinition,
  type NumberFieldDefinition,
  type SelectFieldDefinition,
  type SelectOption
} from '../../types/component.types.ts';
import { generateRequestId } from '../../utils/request-id.ts';

const SUBMISSION_CONTENT_TYPES = Constants.public.Enums.submission_type as readonly SubmissionContentType[];
const FORM_FIELDS_CACHE_TAG = 'submission-form-fields';
const FORM_FIELDS_CACHE_SECONDS = 60 * 60 * 6;

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
    case 'text': {
      return {
        ...base,
        type: 'text' as const,
        defaultValue: item.default_value ?? undefined,
      } as TextFieldDefinition;
    }

    case 'textarea': {
      return {
        ...base,
        type: 'textarea' as const,
        rows: item.rows ?? undefined,
        monospace: item.monospace ?? false,
        defaultValue: item.default_value ?? undefined,
      } as TextareaFieldDefinition;
    }

    case 'number': {
      return {
        ...base,
        type: 'number' as const,
        min: item.min_value ?? undefined,
        max: item.max_value ?? undefined,
        step: item.step_value ?? undefined,
        defaultValue:
          typeof item.default_value === 'number'
            ? (item.default_value as number)
            : undefined,
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

    default: {
      return null;
    }
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
  // Create request-scoped child logger to avoid race conditions
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    operation: 'fetchFieldsForContentType',
    route: 'utility-function', // Utility function - no specific route
    module: 'data/forms/submission-form-fields',
  });

  const result = await fetchCached(
    (client) => new MiscService(client).getFormFieldConfig({ p_form_type: contentType }),
    {
      keyParts: ['submission-form-fields', contentType],
      tags: ['templates', `submission-${contentType}`],
      ttlKey: 'templates',
      fallback: null,
      logMeta: { contentType },
    }
  );

  if (!result?.fields) {
    const normalized = normalizeError(
      new Error('RPC returned null or no fields'),
      'Failed to load form fields'
    );
    requestLogger.error('Failed to load form fields', normalized, {
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
      case 'common': {
        section.common.push(field);
        break;
      }
      case 'type_specific': {
        section.typeSpecific.push(field);
        break;
      }
      case 'tags': {
        section.tags.push(field);
        break;
      }
      case null: {
        // Handle null field_group - add to common by default
        section.common.push(field);
        break;
      }
      default: {
        section.common.push(field);
        break;
      }
    }
  }

  return section;
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

export const getSubmissionFormFields = cache(async () => {
  return unstable_cache(loadSubmissionFormFields, ['submission-form-config'], {
    revalidate: FORM_FIELDS_CACHE_SECONDS,
    tags: [FORM_FIELDS_CACHE_TAG],
  })();
});
