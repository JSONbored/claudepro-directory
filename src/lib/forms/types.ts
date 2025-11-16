import type {
  FormFieldType,
  FormGridColumn,
  FormIconPosition,
  SubmissionType,
} from '@/src/types/database-overrides';

export type FieldType = FormFieldType;
export type GridColumn = FormGridColumn;
export type IconPosition = FormIconPosition;

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

/**
 * Submission content type - extracted from database enum
 * Use this type for type-safe submission content categories
 */
export type SubmissionContentType = SubmissionType;

/**
 * Submission content types array (for runtime use, e.g., form dropdowns)
 * TypeScript will validate that all values match the database enum
 */
export const SUBMISSION_CONTENT_TYPES: readonly SubmissionType[] = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
] as const;

export interface SubmissionFormSection {
  nameField: TextFieldDefinition | null;
  common: FieldDefinition[];
  typeSpecific: FieldDefinition[];
  tags: FieldDefinition[];
}

export type SubmissionFormConfig = Record<SubmissionContentType, SubmissionFormSection>;
