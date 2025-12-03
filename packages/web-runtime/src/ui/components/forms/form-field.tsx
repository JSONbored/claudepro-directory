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
 * @module web-runtime/ui/components/forms/form-field
 *
 * @example Input variant
 * ```tsx
 * <FormField
 *   variant="input"
 *   label="Email"
 *   type="email"
 *   name="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   required
 * />
 * ```
 *
 * @example Textarea variant with character count
 * ```tsx
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
 * ```
 *
 * @example Select variant
 * ```tsx
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

import { useId, useState } from 'react';
import { cn } from '../../utils.ts';
import { size, muted } from '../../../design-system/styles/typography.ts';
import { spaceY, marginLeft } from '../../../design-system/styles/layout.ts';
import { textColor } from '../../../design-system/styles/colors.ts';
import { Input } from '../input.tsx';
import { Label } from '../label.tsx';
import { Select, SelectContent, SelectTrigger, SelectValue } from '../select.tsx';
import { Textarea } from '../textarea.tsx';

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

/**
 * FormField Component
 *
 * Unified form field that handles Input, Textarea, and Select variants.
 * Type-safe with discriminated union for variant-specific props.
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
    <div className={cn(spaceY.compact, className)}>
      {/* Label */}
      <Label htmlFor={fieldId}>
        {label}
        {required && <span className={`${marginLeft.tight} ${textColor.destructive}`}>*</span>}
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
        <p id={descriptionId} className={`${muted.default} ${size.xs}`}>
          {description}
        </p>
      )}

      {/* Character count */}
      {showCharCount && maxLength && (
        <p id={charCountId} className={`${muted.default} ${size.xs}`}>
          {currentCharCount}/{maxLength} characters
        </p>
      )}

      {/* Error message */}
      {error && errorMessage && (
        <p id={errorId} className={`${textColor.destructive} ${size.xs}`} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
