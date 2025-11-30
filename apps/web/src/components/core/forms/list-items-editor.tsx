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
import { between, cluster, iconSize } from '@heyclaude/web-runtime/design-system';
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
 * ListItemManager Component
 *
 * Manages dynamic string arrays in forms with add/remove/validation.
 *
 * @example
 * ```tsx
 * // Badge variant (interests, tags)
 * <ListItemManager
 *   variant="badge"
 *   label="Interests & Skills"
 *   items={interests}
 *   onChange={setInterests}
 *   onFieldChange={() => setHasChanges(true)}
 *   placeholder="Add an interest..."
 *   maxItems={10}
 *   maxLength={30}
 *   noDuplicates
 *   showCounter
 *   badgeStyle="secondary"
 * />
 *
 * // List variant (requirements)
 * <ListItemManager
 *   variant="list"
 *   label="Requirements"
 *   items={requirements}
 *   onChange={setRequirements}
 *   placeholder="e.g., 5+ years of Python experience"
 *   maxItems={20}
 * />
 *
 * // Custom variant
 * <ListItemManager
 *   variant="custom"
 *   label="Custom Items"
 *   items={customItems}
 *   onChange={setCustomItems}
 *   renderItem={(item, index, onRemove) => (
 *     <div key={index}>
 *       {item}
 *       <button onClick={onRemove}>Remove</button>
 *     </div>
 *   )}
 * />
 * ```
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
    <div className={cn('space-y-2', className)}>
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
      {description && <p className="text-muted-foreground text-xs">{description}</p>}

      {/* Counter */}
      {showCounter && maxItems && (
        <p className="text-muted-foreground text-xs">
          {items.length}/{maxItems} {label.toLowerCase()} {items.length === 1 ? 'item' : 'items'}
        </p>
      )}

      {/* Items Display */}
      {items.length > 0 && (
        <>
          {/* Badge variant */}
          {props.variant === 'badge' && (
            <div className="flex flex-wrap gap-2 mt-3">
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
            <div className="space-y-2">
              {items.map((item, index) => {
                // Generate stable key from item content hash
                const itemKey = `item-${item.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)}-${item.length}`;
                return (
                  <div
                    key={itemKey}
                    className={`${between.center} rounded border p-2`}
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
      {showMinError && (
        <p className="text-destructive text-xs">
          At least {minItems} {label.toLowerCase()} {minItems === 1 ? 'is' : 'are'} required
        </p>
      )}

      {/* Custom error message */}
      {errorMessage && (
        <p className="text-destructive text-xs" role="alert">
          {errorMessage}
        </p>
      )}

      {/* Empty state message for required fields */}
      {minItems && items.length === 0 && (
        <p className="text-destructive text-xs">
          At least {minItems} {label.toLowerCase()} {minItems === 1 ? 'is' : 'are'} required
        </p>
      )}
    </div>
  );
}
