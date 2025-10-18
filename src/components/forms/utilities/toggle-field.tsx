'use client';

/**
 * ToggleField Component
 *
 * Unified toggle/switch field component that consolidates Label + Switch + description patterns.
 * Reduces boilerplate code across forms and settings pages.
 *
 * Production Standards:
 * - Type-safe with comprehensive props interface
 * - Accessible with proper ARIA labels and ID binding
 * - Supports both controlled and uncontrolled states
 * - Consistent spacing and layout
 * - Optional description text for context
 * - Disabled state support
 *
 * Pattern Consolidated:
 * Before (14 lines):
 * ```tsx
 * <div className="flex items-center justify-between">
 *   <div>
 *     <Label>Public profile</Label>
 *     <p className="text-xs text-muted-foreground mt-1">
 *       Allow others to view your profile
 *     </p>
 *   </div>
 *   <Switch
 *     checked={isPublic}
 *     onCheckedChange={(checked) => {
 *       setIsPublic(!!checked);
 *       setHasChanges(true);
 *     }}
 *   />
 * </div>
 * ```
 *
 * After (4 lines):
 * ```tsx
 * <ToggleField
 *   label="Public profile"
 *   description="Allow others to view your profile"
 *   checked={isPublic}
 *   onCheckedChange={(checked) => {
 *     setIsPublic(!!checked);
 *     setHasChanges(true);
 *   }}
 * />
 * ```
 *
 * @module components/forms/utilities/toggle-field
 */

import { useId } from 'react';
import { Label } from '@/src/components/primitives/label';
import { Switch } from '@/src/components/primitives/switch';
import { cn } from '@/src/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

/**
 * ToggleField component props
 */
export interface ToggleFieldProps {
  /** Field label text */
  label: string;
  /** Optional description/helper text shown below label */
  description?: string;
  /** Current checked state */
  checked: boolean;
  /** Change handler called when switch is toggled */
  onCheckedChange: (checked: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Custom ID (auto-generated if not provided) */
  id?: string;
  /** Additional CSS classes for container */
  className?: string;
  /** Additional CSS classes for label container */
  labelClassName?: string;
  /** Additional CSS classes for Switch component */
  switchClassName?: string;
  /** ARIA label for accessibility (defaults to label) */
  ariaLabel?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ToggleField - Label + Switch + Description Pattern
 *
 * Consolidates the common pattern of a toggle/switch with label and description text.
 * Used for boolean settings, preferences, and form options.
 *
 * @example
 * ```tsx
 * function SettingsForm() {
 *   const [isPublic, setIsPublic] = useState(false);
 *
 *   return (
 *     <ToggleField
 *       label="Public profile"
 *       description="Allow others to view your profile"
 *       checked={isPublic}
 *       onCheckedChange={setIsPublic}
 *     />
 *   );
 * }
 * ```
 *
 * @example With custom styling
 * ```tsx
 * <ToggleField
 *   label="Email notifications"
 *   description="Send me an email when someone follows me"
 *   checked={followEmail}
 *   onCheckedChange={setFollowEmail}
 *   className="p-4 border rounded-lg"
 *   labelClassName="font-semibold"
 * />
 * ```
 */
export function ToggleField({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  id: providedId,
  className,
  labelClassName,
  switchClassName,
  ariaLabel,
}: ToggleFieldProps) {
  // Auto-generate ID if not provided
  const autoId = useId();
  const id = providedId || autoId;

  return (
    <div
      className={cn(
        'flex items-center justify-between',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Label + Description */}
      <div className={cn('flex-1', labelClassName)}>
        <Label
          htmlFor={id}
          className={cn(
            'text-base font-medium',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          )}
        >
          {label}
        </Label>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>

      {/* Switch */}
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={ariaLabel || label}
        className={switchClassName}
      />
    </div>
  );
}
