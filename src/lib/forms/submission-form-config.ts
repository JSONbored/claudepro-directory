'use server';

import { unstable_cache } from 'next/cache';
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
} from '@/src/lib/forms/types';
import { SUBMISSION_CONTENT_TYPES } from '@/src/lib/forms/types';
import {
  BookOpen,
  Code,
  ExternalLink,
  Github,
  Lightbulb,
  type LucideIcon,
  Rocket,
  Send,
  Server,
  Sparkles,
  Tag,
  Tags,
  Terminal,
} from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/database.types';

const FORM_FIELDS_CACHE_TAG = 'submission-form-fields';
const FORM_FIELDS_CACHE_SECONDS = 60 * 60 * 6; // 6 hours

type RpcRow =
  Database['public']['Functions']['get_form_fields_for_content_type']['Returns'][number];
type RpcRows = Database['public']['Functions']['get_form_fields_for_content_type']['Returns'];

type FieldProperties = Record<string, unknown>;

const FORM_FIELD_ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Code,
  ExternalLink,
  Github,
  Lightbulb,
  Rocket,
  Send,
  Server,
  Sparkles,
  Tag,
  Tags,
  Terminal,
};

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

function mapIcon(iconName: RpcRow['icon']): LucideIcon | undefined {
  if (!iconName) return undefined;
  return FORM_FIELD_ICON_MAP[iconName] ?? undefined;
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
    icon: mapIcon(row.icon),
    iconPosition: mapIconPosition(row.icon_position),
  };

  switch (row.field_type) {
    case 'text': {
      return {
        ...base,
        type: 'text',
        defaultValue: getStringProperty(props, ['defaultValue', 'default_value']),
      } as TextFieldDefinition;
    }

    case 'textarea': {
      return {
        ...base,
        type: 'textarea',
        rows: getNumberProperty(props, ['rows']),
        monospace: getBooleanProperty(props, ['monospace']) ?? false,
        defaultValue: getStringProperty(props, ['defaultValue', 'default_value']),
      } as TextareaFieldDefinition;
    }

    case 'number': {
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

    case 'select': {
      return {
        ...base,
        type: 'select',
        options: mapSelectOptions(row.select_options),
        defaultValue: getStringProperty(props, ['defaultValue', 'default_value']),
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
  supabase: Awaited<ReturnType<typeof createClient>>,
  contentType: SubmissionContentType
): Promise<SubmissionFormSection> {
  if (!supabase || typeof supabase.rpc !== 'function') {
    return emptySection();
  }

  const { data, error } = await supabase.rpc('get_form_fields_for_content_type', {
    p_content_type: contentType,
  });

  if (error) {
    console.error(`Failed to load form fields for ${contentType}:`, error);
    return emptySection();
  }

  const rows = (data ?? []) as RpcRows;
  const section = emptySection();

  for (const row of rows) {
    const field = mapField(row);
    if (!field) continue;

    if (row.field_scope === 'common' && field.name === 'name' && field.type === 'text') {
      section.nameField = field;
      continue;
    }

    switch (row.field_scope) {
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

async function loadSubmissionFormConfig(): Promise<SubmissionFormConfig> {
  const supabase = await createClient();
  const entries = await Promise.all(
    SUBMISSION_CONTENT_TYPES.map(async (contentType) => {
      const section = await fetchFieldsForContentType(supabase, contentType);
      return [contentType, section] as const;
    })
  );

  const config = {} as SubmissionFormConfig;
  for (const [contentType, section] of entries) {
    config[contentType] = section;
  }

  return config;
}

export const getSubmissionFormConfig = unstable_cache(
  loadSubmissionFormConfig,
  ['submission-form-config'],
  {
    revalidate: FORM_FIELDS_CACHE_SECONDS,
    tags: [FORM_FIELDS_CACHE_TAG],
  }
);

export { FORM_FIELDS_CACHE_TAG, FORM_FIELDS_CACHE_SECONDS };
