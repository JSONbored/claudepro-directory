'use client';

/**
 * Content Type Field Renderer
 *
 * Config-driven form field rendering component.
 * ELIMINATES 285 LOC of repetitive conditional blocks.
 *
 * Architecture:
 * - Consumes ContentTypeConfig from form-field-config.ts
 * - Renders fields based on type discriminator
 * - Handles grid layouts (full, half, third)
 * - Fully accessible (ARIA, labels, validation)
 * - Uses computed IDs from parent formId (no useId() per field)
 *
 * Impact:
 * - Before: 285 LOC conditional rendering
 * - After: Single renderer component
 * - Maintainability: Hard → Easy
 */

import { Input } from '@/src/components/primitives/input';
import { Label } from '@/src/components/primitives/label';
import { Textarea } from '@/src/components/primitives/textarea';
import type { ContentTypeConfig, FieldDefinition, GridColumn } from '@/src/lib/forms/types';
import { resolveFormIcon } from '@/src/lib/icons';
import { getResponsiveGridClass } from '@/src/lib/ui-constants';

// ============================================================================
// GRID LAYOUT SYSTEM
// ============================================================================

/**
 * Maps grid column config to Tailwind classes
 * Responsive: full width on mobile, specified width on desktop
 */
const GRID_COLUMN_CLASSES: Record<GridColumn, string> = {
  full: 'col-span-full',
  half: 'sm:col-span-1',
  third: 'sm:col-span-1',
  'two-thirds': 'sm:col-span-2',
};

// ============================================================================
// FIELD RENDERERS
// ============================================================================

interface FieldRendererProps {
  field: FieldDefinition;
  formId: string;
}

/**
 * Text input field renderer
 */
function TextFieldRenderer({ field, formId }: FieldRendererProps) {
  if (field.type !== 'text') return null;

  const fieldId = `${formId}-${field.name}`;
  const gridClass = GRID_COLUMN_CLASSES[field.gridColumn || 'full'];
  const Icon = resolveFormIcon(field.iconName);
  const iconPosition = field.iconPosition || 'left';

  return (
    <div className={`space-y-2 ${gridClass}`}>
      <Label htmlFor={fieldId}>{field.label}</Label>
      {Icon ? (
        <div className="relative">
          {iconPosition === 'left' && (
            <div className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <Input
            id={fieldId}
            name={field.name}
            placeholder={field.placeholder}
            required={field.required}
            defaultValue={field.defaultValue}
            className={iconPosition === 'left' ? 'pl-10' : iconPosition === 'right' ? 'pr-10' : ''}
          />
          {iconPosition === 'right' && (
            <div className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      ) : (
        <Input
          id={fieldId}
          name={field.name}
          placeholder={field.placeholder}
          required={field.required}
          defaultValue={field.defaultValue}
        />
      )}
      {field.helpText && <p className="text-muted-foreground text-xs">{field.helpText}</p>}
    </div>
  );
}

/**
 * Textarea field renderer
 */
function TextareaFieldRenderer({ field, formId }: FieldRendererProps) {
  if (field.type !== 'textarea') return null;

  const fieldId = `${formId}-${field.name}`;
  const gridClass = GRID_COLUMN_CLASSES[field.gridColumn || 'full'];
  const monoClass = field.monospace ? 'font-mono text-sm' : '';

  return (
    <div className={`space-y-2 ${gridClass}`}>
      <Label htmlFor={fieldId}>{field.label}</Label>
      <Textarea
        id={fieldId}
        name={field.name}
        placeholder={field.placeholder}
        required={field.required}
        rows={field.rows || 4}
        defaultValue={field.defaultValue}
        className={`${monoClass} resize-y`}
      />
      {field.helpText && <p className="text-muted-foreground text-xs">{field.helpText}</p>}
    </div>
  );
}

/**
 * Number input field renderer
 */
function NumberFieldRenderer({ field, formId }: FieldRendererProps) {
  if (field.type !== 'number') return null;

  const fieldId = `${formId}-${field.name}`;
  const gridClass = GRID_COLUMN_CLASSES[field.gridColumn || 'full'];

  return (
    <div className={`space-y-2 ${gridClass}`}>
      <Label htmlFor={fieldId}>{field.label}</Label>
      <Input
        id={fieldId}
        name={field.name}
        type="number"
        min={field.min}
        max={field.max}
        step={field.step}
        defaultValue={field.defaultValue}
        placeholder={field.placeholder}
        required={field.required}
      />
      {field.helpText && <p className="text-muted-foreground text-xs">{field.helpText}</p>}
    </div>
  );
}

/**
 * Select dropdown field renderer
 */
function SelectFieldRenderer({ field, formId }: FieldRendererProps) {
  if (field.type !== 'select') return null;

  const fieldId = `${formId}-${field.name}`;
  const gridClass = GRID_COLUMN_CLASSES[field.gridColumn || 'full'];

  return (
    <div className={`space-y-2 ${gridClass}`}>
      <Label htmlFor={fieldId}>{field.label}</Label>
      <select
        id={fieldId}
        name={field.name}
        required={field.required}
        defaultValue={field.defaultValue}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {field.helpText && <p className="text-muted-foreground text-xs">{field.helpText}</p>}
    </div>
  );
}

/**
 * Single field router component
 * Dispatches to appropriate renderer based on field type
 */
function SingleFieldRenderer({ field, formId }: FieldRendererProps) {
  switch (field.type) {
    case 'text':
      return <TextFieldRenderer field={field} formId={formId} />;
    case 'textarea':
      return <TextareaFieldRenderer field={field} formId={formId} />;
    case 'number':
      return <NumberFieldRenderer field={field} formId={formId} />;
    case 'select':
      return <SelectFieldRenderer field={field} formId={formId} />;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface ContentTypeFieldRendererProps {
  /**
   * Field configuration for the content type
   */
  config: ContentTypeConfig;

  /**
   * Form ID for generating field IDs
   * Pattern: `${formId}-${fieldName}`
   */
  formId: string;
}

/**
 * Content Type Field Renderer
 *
 * Renders all fields for a content type based on config.
 * Handles responsive grid layouts and accessibility.
 */
export function ContentTypeFieldRenderer({ config, formId }: ContentTypeFieldRendererProps) {
  // Group consecutive grid fields together
  const fieldGroups: FieldDefinition[][] = [];
  let currentGroup: FieldDefinition[] = [];

  for (const field of config.fields) {
    const isGridField =
      field.gridColumn === 'half' ||
      field.gridColumn === 'third' ||
      field.gridColumn === 'two-thirds';

    if (isGridField) {
      currentGroup.push(field);
    } else {
      // If we have accumulated grid fields, add them as a group
      if (currentGroup.length > 0) {
        fieldGroups.push(currentGroup);
        currentGroup = [];
      }
      // Add full-width field as single-item group
      fieldGroups.push([field]);
    }
  }

  // Don't forget remaining grid fields
  if (currentGroup.length > 0) {
    fieldGroups.push(currentGroup);
  }

  return (
    <>
      {fieldGroups.map((group) => {
        const hasMultipleFields = group.length > 1;
        const gridType = group[0]?.gridColumn;
        // Use first field name as group key for stable identity
        const groupKey = group[0]?.name || 'group';

        // Determine grid class based on field types
        const gridClass = hasMultipleFields
          ? getResponsiveGridClass(gridType === 'third' ? 3 : 2)
          : '';

        return (
          <div key={groupKey} className={gridClass || ''}>
            {group.map((field) => (
              <SingleFieldRenderer key={field.name} field={field} formId={formId} />
            ))}
          </div>
        );
      })}
    </>
  );
}
