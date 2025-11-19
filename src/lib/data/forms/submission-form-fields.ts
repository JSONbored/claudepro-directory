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
  SubmissionContentType,
  SubmissionFormConfig,
  SubmissionFormSection,
  TextareaFieldDefinition,
  TextFieldDefinition,
} from '@/src/lib/types/component.types';
import { SUBMISSION_CONTENT_TYPES } from '@/src/lib/types/component.types';
import type { Database } from '@/src/types/database.types';
import type { GetGetFormFieldsForContentTypeReturn } from '@/src/types/database-overrides';

const FIELD_SCOPE_VALUES = [
  'common',
  'type_specific',
  'tags',
] as const satisfies readonly Database['public']['Enums']['field_scope'][];

const FIELD_TYPE_VALUES = [
  'text',
  'textarea',
  'number',
  'select',
] as const satisfies readonly Database['public']['Enums']['field_type'][];

const GRID_COLUMN_VALUES = [
  'full',
  'half',
  'third',
  'two-thirds',
] as const satisfies readonly Database['public']['Enums']['grid_column'][];

const ICON_POSITION_VALUES = [
  'left',
  'right',
] as const satisfies readonly Database['public']['Enums']['icon_position'][];

type RpcRow = GetGetFormFieldsForContentTypeReturn[number];
type RpcRows = GetGetFormFieldsForContentTypeReturn;

type FieldProperties = Record<string, unknown>;

function parseProperties(properties: RpcRow['field_properties']): FieldProperties {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    return {};
  }

  return properties as FieldProperties;
}

function getStringProperty(props: FieldProperties, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = props[key];
    if (value === undefined || value === null) continue;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  }
  return undefined;
}

function getNumberProperty(props: FieldProperties, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = props[key];
    if (value === undefined || value === null) continue;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return undefined;
}

function getBooleanProperty(props: FieldProperties, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = props[key];
    if (value === undefined || value === null) continue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
  }
  return undefined;
}

function mapGridColumn(value: RpcRow['grid_column']): Database['public']['Enums']['grid_column'] {
  if (value && GRID_COLUMN_VALUES.includes(value as Database['public']['Enums']['grid_column'])) {
    return value as Database['public']['Enums']['grid_column'];
  }
  return 'full';
}

function mapIconPosition(
  value: RpcRow['icon_position']
): Database['public']['Enums']['icon_position'] | undefined {
  if (
    value &&
    ICON_POSITION_VALUES.includes(value as Database['public']['Enums']['icon_position'])
  ) {
    return value as Database['public']['Enums']['icon_position'];
  }
  return undefined;
}

function mapSelectOptions(selectOptions: unknown) {
  if (!(selectOptions && Array.isArray(selectOptions))) return [];
  return selectOptions
    .map((option) => {
      if (!option || typeof option !== 'object') return null;
      const value = 'value' in option ? option.value : undefined;
      const label = 'label' in option ? option.label : undefined;
      if (typeof value !== 'string' || typeof label !== 'string') return null;
      return { value, label };
    })
    .filter((option): option is { value: string; label: string } => option !== null);
}

function mapField(row: RpcRow): FieldDefinition | null {
  const props = parseProperties(row.field_properties);
  const placeholder = props['placeholder'] as string | undefined;
  const required = props['required'] as boolean | undefined;
  const selectOptions = props['select_options'] as unknown;
  const base = {
    name: row.field_name,
    label: row.label,
    placeholder,
    helpText: row.help_text ?? undefined,
    required: required ?? false,
    gridColumn: mapGridColumn(row.grid_column),
    iconName: row.icon ?? undefined,
    iconPosition: mapIconPosition(row.icon_position),
  };

  switch (row.field_type as Database['public']['Enums']['field_type']) {
    case FIELD_TYPE_VALUES[0]: // 'text'
      return {
        ...base,
        type: 'text',
        defaultValue: getStringProperty(props, ['defaultValue', 'default_value']),
      } as TextFieldDefinition;

    case FIELD_TYPE_VALUES[1]: // 'textarea'
      return {
        ...base,
        type: 'textarea',
        rows: getNumberProperty(props, ['rows']),
        monospace: getBooleanProperty(props, ['monospace']) ?? false,
        defaultValue: getStringProperty(props, ['defaultValue', 'default_value']),
      } as TextareaFieldDefinition;

    case FIELD_TYPE_VALUES[2]: {
      // 'number'
      const defaultValue = getNumberProperty(props, ['defaultValue', 'default_value']);
      const fallbackString = getStringProperty(props, ['defaultValue', 'default_value']);
      return {
        ...base,
        type: 'number',
        min: getNumberProperty(props, ['min']),
        max: getNumberProperty(props, ['max']),
        step: getNumberProperty(props, ['step']),
        defaultValue: defaultValue ?? fallbackString,
      } as NumberFieldDefinition;
    }

    case FIELD_TYPE_VALUES[3]: // 'select'
      return {
        ...base,
        type: 'select',
        options: mapSelectOptions(selectOptions),
        defaultValue: getStringProperty(props, ['defaultValue', 'default_value']),
      } as SelectFieldDefinition;

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
  const data = await fetchCachedRpc<'get_form_fields_for_content_type', RpcRows | null>(
    { p_content_type: contentType },
    {
      rpcName: 'get_form_fields_for_content_type',
      tags: ['templates', `submission-${contentType}`],
      ttlKey: 'cache.templates.ttl_seconds',
      keySuffix: contentType,
      fallback: null,
      logMeta: { contentType },
    }
  );

  if (!data) {
    logger.error('Failed to load form fields', new Error('RPC returned null'), {
      contentType,
      source: 'SubmissionFormConfig',
    });
    return emptySection();
  }

  const rows = data;
  const section = emptySection();

  for (const row of rows) {
    const field = mapField(row);
    if (!field) continue;

    if (
      row.field_scope === FIELD_SCOPE_VALUES[0] &&
      field.name === 'name' &&
      field.type === FIELD_TYPE_VALUES[0]
    ) {
      section.nameField = field;
      continue;
    }

    switch (row.field_scope as Database['public']['Enums']['field_scope']) {
      case FIELD_SCOPE_VALUES[0]: // 'common'
        section.common.push(field);
        break;
      case FIELD_SCOPE_VALUES[1]: // 'type_specific'
        section.typeSpecific.push(field);
        break;
      case FIELD_SCOPE_VALUES[2]: // 'tags'
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
