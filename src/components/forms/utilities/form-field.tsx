'use client';

/**
 * FormField Component
 *
 * Unified form field component that consolidates Label + Input/Textarea/Select patterns.
 * Reduces boilerplate code across forms by handling common concerns:
 * - Auto-generated unique IDs
 * - Label + field binding
 * - Required field indicators
 * - Error states and messages
 * - Helper text and character counters
 * - Consistent spacing and accessibility
 *
 * Production Standards:
 * - Type-safe with discriminated union variants
 * - Accessible with ARIA labels and error handling
 * - Supports both controlled and uncontrolled fields
 * - Integrates with existing primitives (Input, Textarea, Select)
 * - Character count display for maxLength fields
 *
 * @module components/forms/utilities/form-field
 */

import { useId, useState } from 'react';
import { Input } from '@/src/components/primitives/input';
import { Label } from '@/src/components/primitives/label';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/src/components/primitives/select';
import { Textarea } from '@/src/components/primitives/textarea';
import { cn } from '@/src/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Base props shared across all field variants
 */
interface FormFieldBaseProps {
  /** Field label text */
  label: string;
  /** Custom ID (auto-generated if not provided) */
  id?: string;
  /** Mark field as required */
  required?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Helper/description text */
  description?: string;
  /** Additional CSS classes for container */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Input variant props
 */
export interface FormFieldInputProps extends FormFieldBaseProps {
  variant: 'input';
  /** Input type */
  type?: 'text' | 'email' | 'url' | 'password' | 'number';
  /** Field name */
  name?: string;
  /** Current value (controlled) */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum character length */
  maxLength?: number;
  /** Show character count (requires maxLength or value) */
  showCharCount?: boolean;
}

/**
 * Textarea variant props
 */
export interface FormFieldTextareaProps extends FormFieldBaseProps {
  variant: 'textarea';
  /** Field name */
  name?: string;
  /** Current value (controlled) */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Number of rows */
  rows?: number;
  /** Maximum character length */
  maxLength?: number;
  /** Show character count (requires maxLength or value) */
  showCharCount?: boolean;
}

/**
 * Select variant props
 */
export interface FormFieldSelectProps extends FormFieldBaseProps {
  variant: 'select';
  /** Field name */
  name?: string;
  /** Current value (controlled) */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Change handler */
  onValueChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** SelectItem children */
  children: React.ReactNode;
}

/**
 * Discriminated union of all FormField variants
 */
export type FormFieldProps = FormFieldInputProps | FormFieldTextareaProps | FormFieldSelectProps;

// =============================================================================
// FORM FIELD COMPONENT
// =============================================================================

/**
 * FormField Component
 *
 * Unified form field that handles Input, Textarea, and Select variants.
 *
 * @example
 * ```tsx
 * // Input variant
 * <FormField
 *   variant="input"
 *   label="Email"
 *   type="email"
 *   name="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   required
 * />
 *
 * // Textarea variant with character count
 * <FormField
 *   variant="textarea"
 *   label="Bio"
 *   name="bio"
 *   value={bio}
 *   onChange={(e) => setBio(e.target.value)}
 *   maxLength={500}
 *   showCharCount
 *   rows={4}
 * />
 *
 * // Select variant
 * <FormField
 *   variant="select"
 *   label="Type"
 *   name="type"
 *   defaultValue="full-time"
 * >
 *   <SelectItem value="full-time">Full Time</SelectItem>
 *   <SelectItem value="part-time">Part Time</SelectItem>
 * </FormField>
 * ```
 */
export function FormField(props: FormFieldProps) {
  const {
    label,
    id: providedId,
    required = false,
    error = false,
    errorMessage,
    description,
    className,
    disabled = false,
  } = props;

  // Generate unique IDs for accessibility
  const generatedId = useId();
  const fieldId = providedId || generatedId;
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;
  const charCountId = `${fieldId}-char-count`;

  // Character count state (for controlled fields)
  const [charCount, setCharCount] = useState<number>(0);

  // Determine if we should show character count
  const showCharCount =
    (props.variant === 'input' || props.variant === 'textarea') && props.showCharCount;

  // Calculate current character count
  const currentCharCount =
    (props.variant === 'input' || props.variant === 'textarea') && props.value
      ? props.value.length
      : charCount;

  // Get maxLength for character counter
  const maxLength =
    props.variant === 'input' || props.variant === 'textarea' ? props.maxLength : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <Label htmlFor={fieldId}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {/* Field variant */}
      {props.variant === 'input' && (
        <Input
          id={fieldId}
          type={props.type || 'text'}
          {...(props.name && { name: props.name })}
          {...(props.value !== undefined && { value: props.value })}
          {...(props.defaultValue !== undefined && { defaultValue: props.defaultValue })}
          onChange={(e) => {
            props.onChange?.(e);
            if (showCharCount) {
              setCharCount(e.target.value.length);
            }
          }}
          {...(props.placeholder && { placeholder: props.placeholder })}
          {...(props.maxLength && { maxLength: props.maxLength })}
          required={required}
          disabled={disabled}
          error={error}
          {...(error && { errorId })}
          aria-describedby={cn(
            description && descriptionId,
            error && errorId,
            showCharCount && charCountId
          )}
        />
      )}

      {props.variant === 'textarea' && (
        <Textarea
          id={fieldId}
          {...(props.name && { name: props.name })}
          {...(props.value !== undefined && { value: props.value })}
          {...(props.defaultValue !== undefined && { defaultValue: props.defaultValue })}
          onChange={(e) => {
            props.onChange?.(e);
            if (showCharCount) {
              setCharCount(e.target.value.length);
            }
          }}
          {...(props.placeholder && { placeholder: props.placeholder })}
          {...(props.rows && { rows: props.rows })}
          {...(props.maxLength && { maxLength: props.maxLength })}
          required={required}
          disabled={disabled}
          error={error}
          {...(error && { errorId })}
          aria-describedby={cn(
            description && descriptionId,
            error && errorId,
            showCharCount && charCountId
          )}
        />
      )}

      {props.variant === 'select' && (
        <Select
          {...(props.name && { name: props.name })}
          {...(props.value !== undefined && { value: props.value })}
          {...(props.defaultValue !== undefined && { defaultValue: props.defaultValue })}
          {...(props.onValueChange && { onValueChange: props.onValueChange })}
          disabled={disabled}
          required={required}
        >
          <SelectTrigger
            id={fieldId}
            error={error}
            {...(error && { errorId })}
            aria-describedby={cn(description && descriptionId, error && errorId)}
          >
            <SelectValue {...(props.placeholder && { placeholder: props.placeholder })} />
          </SelectTrigger>
          <SelectContent>{props.children}</SelectContent>
        </Select>
      )}

      {/* Helper text */}
      {description && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {/* Character count */}
      {showCharCount && maxLength && (
        <p id={charCountId} className="text-xs text-muted-foreground">
          {currentCharCount}/{maxLength} characters
        </p>
      )}

      {/* Error message */}
      {error && errorMessage && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
