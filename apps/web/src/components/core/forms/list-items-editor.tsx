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
import { between, cluster, iconSize, spaceY, muted ,size  , gap  } from '@heyclaude/web-runtime/design-system';
import { cn, toasts } from '@heyclaude/web-runtime/ui';
import { useState } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import { Input } from '@heyclaude/web-runtime/ui';
import { Label } from '@heyclaude/web-runtime/ui';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Base props shared across all variants
 */
interface ListItemManagerBaseProps {
  /** Field label */
  label: string;
  /** Current list of items */
  items: string[];
  /** Callback when items change */
  onChange: (items: string[]) => void;
  /** Placeholder text for input */
  placeholder?: string;
  /** Helper text / description */
  description?: string;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Minimum number of items (shows error if below) */
  minItems?: number;
  /** Maximum number of items (prevents adding more) */
  maxItems?: number;
  /** Maximum character length per item */
  maxLength?: number;
  /** Prevent duplicate items */
  noDuplicates?: boolean;
  /** Show item counter (e.g., "5/10 items") */
  showCounter?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Callback when field changes (for parent form state tracking) */
  onFieldChange?: () => void;
}

/**
 * Badge variant props
 */
export interface ListItemManagerBadgeProps extends ListItemManagerBaseProps {
  variant: 'badge';
  /** Badge style variant */
  badgeStyle?: 'secondary' | 'outline' | 'default';
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
  variant: 'custom';
  /** Custom render function for each item */
  renderItem: (item: string, index: number, onRemove: () => void) => React.ReactNode;
}

/**
 * Discriminated union of all ListItemManager variants
 */
export type ListItemManagerProps =
  | ListItemManagerBadgeProps
  | ListItemManagerListProps
  | ListItemManagerCustomProps;

// =============================================================================
// LIST ITEM MANAGER COMPONENT
// =============================================================================

/**
 * Renders a controlled UI for managing a dynamic list of string items with add, remove and validation controls.
 *
 * Supports three visual variants ("badge", "list", "custom"), optional limits (minItems, maxItems, maxLength),
 * duplicate prevention, an item counter, and hooks for change tracking.
 *
 * @param props.label - Visible label for the field
 * @param props.items - Current array of string items
 * @param props.onChange - Callback invoked with the new items array when items change
 * @param props.variant - Visual variant: "badge" | "list" | "custom"
 * @param props.placeholder - Input placeholder text (default: "Add item...")
 * @param props.description - Optional helper text displayed below the input
 * @param props.className - Additional className applied to the root container
 * @param props.disabled - When true, disables input and remove actions
 * @param props.minItems - Minimum required number of items (used for validation messages)
 * @param props.maxItems - Maximum allowed number of items
 * @param props.maxLength - Maximum character length per item
 * @param props.noDuplicates - When true, prevents adding duplicate items
 * @param props.showCounter - When true and maxItems is provided, shows "n/max" counter
 * @param props.errorMessage - Optional custom error text to display beneath the control
 * @param props.onFieldChange - Optional callback invoked after a successful add or remove
 * @param props.badgeStyle - (badge variant) visual style for badges ("secondary" | "outline" | "default")
 * @param props.renderItem - (custom variant) render callback: (item, index, onRemove) => ReactNode
 *
 * @returns The rendered JSX element for the ListItemManager component.
 *
 * @see UnifiedBadge
 * @see Button
 * @see Input
 * @see Label
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
  const validateItem = (value: string): { valid: boolean; error?: string } => {
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
    <div className={cn(spaceY.compact, className)}>
      {/* Label */}
      <Label>{label}</Label>

      {/* Input + Button */}
      <div className={cluster.compact}>
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
      {description && <p className={`${muted.default} ${size.xs}`}>{description}</p>}

      {/* Counter */}
      {showCounter && maxItems && (
        <p className={`${muted.default} ${size.xs}`}>
          {items.length}/{maxItems} {label.toLowerCase()} {items.length === 1 ? 'item' : 'items'}
        </p>
      )}

      {/* Items Display */}
      {items.length > 0 && (
        <>
          {/* Badge variant */}
          {props.variant === 'badge' && (
            <div className={`flex flex-wrap ${gap.compact} mt-3`}>
              {items.map((item, index) => (
                <UnifiedBadge
                  key={item}
                  variant="base"
                  style={props.badgeStyle || 'secondary'}
                  className={`${gap.tight} pr-1`}
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="ml-1 hover:text-destructive"
                    aria-label={`Remove ${item}`}
                    disabled={disabled}
                  >
                    <X className={iconSize.xs} />
                  </button>
                </UnifiedBadge>
              ))}
            </div>
          )}

          {/* List variant */}
          {props.variant === 'list' && (
            <div className={spaceY.compact}>
              {items.map((item, index) => {
                // Generate stable key from item content hash
                const itemKey = `item-${item.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)}-${item.length}`;
                return (
                  <div
                    key={itemKey}
                    className={cn(between.center, 'rounded border ${padding.tight}')}
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
            <div className={spaceY.compact}>
              {items.map((item, index) => props.renderItem(item, index, () => handleRemove(index)))}
            </div>
          )}
        </>
      )}

      {/* Min items error */}
      {showMinError && (
        <p className={`text-destructive ${size.xs}`}>
          At least {minItems} {label.toLowerCase()} {minItems === 1 ? 'is' : 'are'} required
        </p>
      )}

      {/* Custom error message */}
      {errorMessage && (
        <p className={`text-destructive ${size.xs}`} role="alert">
          {errorMessage}
        </p>
      )}

      {/* Empty state message for required fields */}
      {minItems && items.length === 0 && (
        <p className={`text-destructive ${size.xs}`}>
          At least {minItems} {label.toLowerCase()} {minItems === 1 ? 'is' : 'are'} required
        </p>
      )}
    </div>
  );
}