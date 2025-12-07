'use client';

/**
 * ListItemManager Component
 *
 * Unified list management component for dynamic arrays in forms.
 * Consolidates repetitive add/remove/validation patterns across:
 * - Interests (profile-edit-form)
 * - Tags, Requirements, Benefits (job-form)
 *
 * Production Standards:
 * - Type-safe with discriminated union variants
 * - Flexible rendering (badge vs list styles)
 * - Built-in validation (min/max items, maxLength, no duplicates)
 * - Accessible with ARIA labels
 * - Toast integration for user feedback
 * - Counter display and error states
 *
 * @module components/forms/utilities/list-item-manager
 */

import { X } from '@heyclaude/web-runtime/icons';
import {
  cn,
  toasts,
  UI_CLASSES,
  UnifiedBadge,
  Button,
  Input,
  Label,
} from '@heyclaude/web-runtime/ui';
import { useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Base props shared across all variants
 */
interface ListItemManagerBaseProps {
  /** Additional CSS classes */
  className?: string;
  /** Helper text / description */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Current list of items */
  items: string[];
  /** Field label */
  label: string;
  /** Maximum number of items (prevents adding more) */
  maxItems?: number;
  /** Maximum character length per item */
  maxLength?: number;
  /** Minimum number of items (shows error if below) */
  minItems?: number;
  /** Prevent duplicate items */
  noDuplicates?: boolean;
  /** Callback when items change */
  onChange: (items: string[]) => void;
  /** Callback when field changes (for parent form state tracking) */
  onFieldChange?: () => void;
  /** Placeholder text for input */
  placeholder?: string;
  /** Show item counter (e.g., "5/10 items") */
  showCounter?: boolean;
}

/**
 * Badge variant props
 */
export interface ListItemManagerBadgeProps extends ListItemManagerBaseProps {
  /** Badge style variant */
  badgeStyle?: 'default' | 'outline' | 'secondary';
  variant: 'badge';
}

/**
 * List variant props
 */
export interface ListItemManagerListProps extends ListItemManagerBaseProps {
  variant: 'list';
}

/**
 * Custom render variant props
 */
export interface ListItemManagerCustomProps extends ListItemManagerBaseProps {
  /** Custom render function for each item */
  renderItem: (item: string, index: number, onRemove: () => void) => React.ReactNode;
  variant: 'custom';
}

/**
 * Discriminated union of all ListItemManager variants
 */
export type ListItemManagerProps =
  | ListItemManagerBadgeProps
  | ListItemManagerCustomProps
  | ListItemManagerListProps;

// =============================================================================
// LIST ITEM MANAGER COMPONENT
// =============================================================================

/**
 * Manage a dynamic list of string items with add/remove controls, validation, and multiple render variants.
 *
 * Supports adding items via button or Enter, removing items, validation (min/max count, max length, duplicate prevention),
 * an optional counter, and three render modes: "badge", "list", and "custom".
 *
 * @param props.variant - Display variant: "badge" renders pills, "list" renders stacked entries, "custom" delegates item rendering to `renderItem`
 * @param props.label - Visible field label used in UI text and accessibility labels
 * @param props.items - Current array of string items managed by the component
 * @param props.onChange - Callback invoked with the updated items array after add/remove operations
 * @param props.onFieldChange - Optional callback invoked whenever the field value changes (useful to mark form dirty state)
 * @param props.placeholder - Placeholder text for the input used to add new items
 * @param props.description - Optional helper text shown below the input
 * @param props.className - Optional container CSS class names
 * @param props.disabled - When true, disables input and remove controls
 * @param props.minItems - Optional minimum number of items required (triggers a validation message when below threshold)
 * @param props.maxItems - Optional maximum number of items allowed (prevents adding above this limit)
 * @param props.maxLength - Optional maximum length for each item string
 * @param props.noDuplicates - When true, prevents adding duplicate item values
 * @param props.showCounter - When true and `maxItems` is set, shows an items/count counter
 * @param props.errorMessage - Optional custom error message to display (renders with role="alert")
 * @param props.badgeStyle - When `variant` is "badge", selects the visual style: "default" | "outline" | "secondary"
 * @param props.renderItem - Required when `variant` is "custom"; called as (item, index, onRemove) => ReactNode to render each item
 *
 * @see UnifiedBadge, Button, Input, Label
 */
export function ListItemManager(props: ListItemManagerProps) {
  const {
    label,
    items,
    onChange,
    placeholder = 'Add item...',
    description,
    className,
    disabled = false,
    minItems,
    maxItems,
    maxLength,
    noDuplicates = false,
    showCounter = false,
    errorMessage,
    onFieldChange,
  } = props;

  const [currentInput, setCurrentInput] = useState('');

  // Validation helper
  const validateItem = (value: string): { error?: string; valid: boolean } => {
    const trimmed = value.trim();

    if (!trimmed) {
      return { valid: false, error: 'Item cannot be empty' };
    }

    if (maxItems && items.length >= maxItems) {
      return { valid: false, error: `Maximum ${maxItems} items allowed` };
    }

    if (noDuplicates && items.includes(trimmed)) {
      return { valid: false, error: 'Item already added' };
    }

    if (maxLength && trimmed.length > maxLength) {
      return { valid: false, error: `Item must be less than ${maxLength} characters` };
    }

    return { valid: true };
  };

  // Add handler
  const handleAdd = () => {
    const trimmed = currentInput.trim();
    if (!trimmed) return;

    const validation = validateItem(trimmed);
    if (!validation.valid) {
      toasts.error.validation(validation.error || 'Invalid item');
      return;
    }

    onChange([...items, trimmed]);
    setCurrentInput('');
    onFieldChange?.();
  };

  // Remove handler
  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    onFieldChange?.();
  };

  // Enter key support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  // Show error if below minItems
  const showMinError = minItems && items.length < minItems && items.length > 0;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <Label>{label}</Label>

      {/* Input + Button */}
      <div className={UI_CLASSES.FLEX_GAP_2}>
        <Input
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled || (maxItems ? items.length >= maxItems : false)}
        />
        <Button
          type="button"
          onClick={handleAdd}
          variant="outline"
          disabled={disabled || (maxItems ? items.length >= maxItems : false)}
        >
          Add
        </Button>
      </div>

      {/* Description */}
      {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}

      {/* Counter */}
      {showCounter && maxItems ? (
        <p className="text-muted-foreground text-xs">
          {items.length}/{maxItems} {label.toLowerCase()} {items.length === 1 ? 'item' : 'items'}
        </p>
      ) : null}

      {/* Items Display */}
      {items.length > 0 && (
        <>
          {/* Badge variant */}
          {props.variant === 'badge' && (
            <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2} mt-3`}>
              {items.map((item, index) => (
                <UnifiedBadge
                  key={item}
                  variant="base"
                  style={props.badgeStyle || 'secondary'}
                  className="gap-1 pr-1"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="hover:text-destructive ml-1"
                    aria-label={`Remove ${item}`}
                    disabled={disabled}
                  >
                    <X className={UI_CLASSES.ICON_XS} />
                  </button>
                </UnifiedBadge>
              ))}
            </div>
          )}

          {/* List variant */}
          {props.variant === 'list' && (
            <div className="space-y-2">
              {items.map((item, index) => {
                // Generate stable key from item content hash
                const itemKey = `item-${item.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)}-${item.length}`;
                return (
                  <div
                    key={itemKey}
                    className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} rounded border p-2`}
                  >
                    <span className="text-sm">{item}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(index)}
                      aria-label={`Remove ${label.toLowerCase()}: ${item}`}
                      disabled={disabled}
                    >
                      ×
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom variant */}
          {props.variant === 'custom' && (
            <div className="space-y-2">
              {items.map((item, index) => props.renderItem(item, index, () => handleRemove(index)))}
            </div>
          )}
        </>
      )}

      {/* Min items error */}
      {showMinError ? (
        <p className="text-destructive text-xs">
          At least {minItems} {label.toLowerCase()} {minItems === 1 ? 'is' : 'are'} required
        </p>
      ) : null}

      {/* Custom error message */}
      {errorMessage ? (
        <p className="text-destructive text-xs" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {/* Empty state message for required fields */}
      {minItems && items.length === 0 ? (
        <p className="text-destructive text-xs">
          At least {minItems} {label.toLowerCase()} {minItems === 1 ? 'is' : 'are'} required
        </p>
      ) : null}
    </div>
  );
}