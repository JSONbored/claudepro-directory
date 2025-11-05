import type { Enums } from '@/src/types/database.types';

export type FieldType = Enums<'form_field_type'>;
export type GridColumn = Enums<'form_grid_column'>;
export type IconPosition = Enums<'form_icon_position'>;

export interface SelectOption {
  value: string;
  label: string;
}

interface BaseFieldDefinition {
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  gridColumn?: GridColumn;
  iconName?: string;
  iconPosition?: IconPosition;
}

export interface TextFieldDefinition extends BaseFieldDefinition {
  type: 'text';
  defaultValue?: string;
}

export interface TextareaFieldDefinition extends BaseFieldDefinition {
  type: 'textarea';
  rows?: number;
  monospace?: boolean;
  defaultValue?: string;
}

export interface NumberFieldDefinition extends BaseFieldDefinition {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number | string;
}

export interface SelectFieldDefinition extends BaseFieldDefinition {
  type: 'select';
  options: SelectOption[];
  defaultValue?: string;
}

export type FieldDefinition =
  | TextFieldDefinition
  | TextareaFieldDefinition
  | NumberFieldDefinition
  | SelectFieldDefinition;

export interface ContentTypeConfig {
  fields: FieldDefinition[];
}

export const SUBMISSION_CONTENT_TYPES = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
] as const;

export type SubmissionContentType = (typeof SUBMISSION_CONTENT_TYPES)[number];

export interface SubmissionFormSection {
  nameField: TextFieldDefinition | null;
  common: FieldDefinition[];
  typeSpecific: FieldDefinition[];
  tags: FieldDefinition[];
}

export type SubmissionFormConfig = Record<SubmissionContentType, SubmissionFormSection>;
