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
  GridColumn,
  IconPosition,
  NumberFieldDefinition,
  SelectFieldDefinition,
  SubmissionContentType,
  SubmissionFormConfig,
  SubmissionFormSection,
  TextareaFieldDefinition,
  TextFieldDefinition,
} from '@/src/lib/types/component.types';
import { SUBMISSION_CONTENT_TYPES } from '@/src/lib/types/component.types';
import type { GetGetFormFieldsForContentTypeReturn } from '@/src/types/database-overrides';
import {
  FIELD_SCOPE_VALUES,
  FIELD_TYPE_VALUES,
  type FieldScope,
  type FieldType,
} from '@/src/types/database-overrides';

type RpcRow = GetGetFormFieldsForContentTypeReturn[number];
type RpcRows = GetGetFormFieldsForContentTypeReturn;

type FieldProperties = Record<string, unknown>;

const ICON_POSITION_VALUES: readonly IconPosition[] = ['left', 'right'] as const;
const GRID_COLUMN_VALUES: readonly GridColumn[] = ['full', 'half', 'third', 'two-thirds'] as const;

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

function mapGridColumn(value: RpcRow['grid_column']): GridColumn {
  if (value && GRID_COLUMN_VALUES.includes(value as GridColumn)) {
    return value as GridColumn;
  }
  return 'full';
}

function mapIconPosition(value: RpcRow['icon_position']): IconPosition | undefined {
  if (value && ICON_POSITION_VALUES.includes(value as IconPosition)) {
    return value as IconPosition;
  }
  return undefined;
}

function mapSelectOptions(selectOptions: RpcRow['select_options']) {
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
  const base = {
    name: row.field_name,
    label: row.label,
    placeholder: row.placeholder ?? undefined,
    helpText: row.help_text ?? undefined,
    required: row.required ?? false,
    gridColumn: mapGridColumn(row.grid_column),
    iconName: row.icon ?? undefined,
    iconPosition: mapIconPosition(row.icon_position),
  };

  switch (row.field_type as FieldType) {
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
        options: mapSelectOptions(row.select_options),
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

    switch (row.field_scope as FieldScope) {
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
