'use client';

/**
 * Animated Form Field - Enhanced Input with Validation Feedback
 *
 * Wraps form fields with visual validation feedback, animations, and help text.
 * Provides real-time feedback for user input with smooth transitions.
 *
 * Features:
 * - Real-time validation feedback (success/error/warning states)
 * - Character count for text inputs
 * - Animated state transitions
 * - Focus management with visual indicators
 * - Help text and error message display
 * - Responsive design
 */

import { AlertCircle, AlertTriangle, CheckCircle, Info } from '@heyclaude/web-runtime/icons';
import { cn, Label } from '@heyclaude/web-runtime/ui';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@heyclaude/web-runtime/design-tokens';
import { SPRING } from '@heyclaude/web-runtime/design-system';
import { AnimatePresence, motion } from 'motion/react';
import { type FocusEvent, type ReactNode, useCallback, useState } from 'react';

export type ValidationState = 'idle' | 'invalid' | 'valid' | 'warning';

interface AnimatedFormFieldProps {
  children: ReactNode;
  className?: string;
  currentLength?: number;
  errorMessage?: string;
  fieldClassName?: string;
  helpText?: string;
  id: string;
  label: string;
  maxLength?: number;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  required?: boolean;
  showCharCount?: boolean;
  successMessage?: string;
  validationState?: ValidationState;
  warningMessage?: string;
}

/**
 * Renders a form field wrapper that provides animated focus/validation visuals, optional character count, and contextual messages.
 *
 * Displays a label, required indicator, animated border and glow based on focus and validation state, an optional validation icon, a help/error/warning/success message with icon, and a focus indicator bar. Character count is shown when enabled and `maxLength` is provided.
 *
 * @param children - The input element(s) to render inside the field wrapper (e.g., input, textarea, select).
 * @param label - The visible label text associated with the field.
 * @param id - The id used by the label's htmlFor to associate the label with the field.
 * @param required - Whether the field is required; renders a required indicator when true.
 * @param helpText - Informational text shown when no error, warning, or success message is present.
 * @param errorMessage - Error message text; takes priority over warning, success, and help text.
 * @param warningMessage - Warning message text; shown if no errorMessage is present.
 * @param successMessage - Success message text; shown if no errorMessage or warningMessage is present.
 * @param validationState - Visual validation state; one of `'idle' | 'invalid' | 'valid' | 'warning'`.
 * @param showCharCount - When true and `maxLength` is provided, displays the current / max character count.
 * @param currentLength - Current number of characters in the field; used for the character count display.
 * @param maxLength - Maximum allowed characters; used for the character count display and styling when near/over limit.
 * @param className - Additional class names applied to the outer container.
 * @param fieldClassName - Additional class names applied to the field wrapper that surrounds `children`.
 * @param onFocus - Optional focus event handler forwarded from the inner field(s); called when the wrapper receives focus.
 * @param onBlur - Optional blur event handler forwarded from the inner field(s); called when the wrapper loses focus.
 * @returns The rendered AnimatedFormField component tree.
 *
 * @see FormFieldVariants for preconfigured field variants (text, textarea, select).
 */
export function AnimatedFormField({
  children,
  label,
  id,
  required = false,
  helpText,
  errorMessage,
  warningMessage,
  successMessage,
  validationState = 'idle',
  showCharCount = false,
  currentLength = 0,
  maxLength,
  className,
  fieldClassName,
  onFocus,
  onBlur,
}: AnimatedFormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLElement>) => {
      setIsFocused(true);
      setHasInteracted(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  // Determine which message to show
  const message = errorMessage || warningMessage || successMessage || helpText;
  const messageType = errorMessage
    ? 'error'
    : warningMessage
      ? 'warning'
      : successMessage
        ? 'success'
        : 'help';

  // Get icon based on validation state
  const getValidationIcon = () => {
    if (!hasInteracted && validationState === 'idle') return null;

    switch (validationState) {
      case 'valid': {
        return (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={SPRING.bouncy}
          >
            <CheckCircle className="h-5 w-5" style={{ color: TOKENS.colors.success.text }} />
          </motion.div>
        );
      }
      case 'invalid': {
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={SPRING.snappy}
          >
            <AlertCircle className="h-5 w-5" style={{ color: TOKENS.colors.error.text }} />
          </motion.div>
        );
      }
      case 'warning': {
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={SPRING.snappy}
          >
            <AlertTriangle className="h-5 w-5" style={{ color: TOKENS.colors.warning.text }} />
          </motion.div>
        );
      }
      default: {
        return null;
      }
    }
  };

  // Get border color based on state
  const getBorderColor = () => {
    if (isFocused) return TOKENS.colors.accent.primary;
    if (!hasInteracted) return TOKENS.colors.border.default;

    switch (validationState) {
      case 'valid': {
        return TOKENS.colors.success.border;
      }
      case 'invalid': {
        return TOKENS.colors.error.border;
      }
      case 'warning': {
        return TOKENS.colors.warning.border;
      }
      default: {
        return TOKENS.colors.border.default;
      }
    }
  };

  // Get glow effect based on state
  const getGlowEffect = () => {
    if (!isFocused && validationState === 'idle') return 'none';

    if (isFocused) return TOKENS.shadows.glow.orange;

    switch (validationState) {
      case 'valid': {
        return TOKENS.shadows.glow.green;
      }
      case 'invalid': {
        return TOKENS.shadows.glow.red;
      }
      default: {
        return 'none';
      }
    }
  };

  return (
    <motion.div
      className={cn('space-y-2', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.smooth}
    >
      {/* Label Row */}
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="flex items-center gap-1.5">
          <span>{label}</span>
          {required ? (
            <span className="text-accent-primary" style={{ color: TOKENS.colors.accent.primary }}>
              *
            </span>
          ) : null}
        </Label>

        {/* Character Count */}
        {showCharCount && maxLength ? (
          <motion.span
            className={cn(
              'text-xs transition-colors',
              currentLength > maxLength * 0.9 && currentLength < maxLength
                ? 'text-warning'
                : currentLength >= maxLength
                  ? 'text-error'
                  : 'text-muted-foreground'
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {currentLength} / {maxLength}
          </motion.span>
        ) : null}
      </div>

      {/* Field Container with Validation Icon */}
      <div className="relative">
        <motion.div
          className={cn('relative transition-all', fieldClassName)}
          animate={{
            borderColor: getBorderColor(),
          }}
          transition={{ duration: 0.2 }}
          style={{
            boxShadow: getGlowEffect(),
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {children}
        </motion.div>

        {/* Validation Icon (positioned absolute right) */}
        <AnimatePresence mode="wait">
          {getValidationIcon() && (
            <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
              {getValidationIcon()}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Message Row (Help Text / Error / Warning / Success) */}
      <AnimatePresence mode="wait">
        {message ? (
          <motion.div
            key={`${messageType}-${message}`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={SPRING.smooth}
            className="flex items-start gap-2"
          >
            {/* Icon for messages */}
            {messageType === 'error' && (
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: TOKENS.colors.error.text }}
              />
            )}
            {messageType === 'warning' && (
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: TOKENS.colors.warning.text }}
              />
            )}
            {messageType === 'success' && (
              <CheckCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: TOKENS.colors.success.text }}
              />
            )}
            {messageType === 'help' && (
              <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
            )}

            {/* Message Text */}
            <span
              className={cn(
                'text-sm',
                messageType === 'error' && 'font-medium',
                messageType === 'warning' && 'font-medium',
                messageType === 'success' && 'font-medium',
                messageType === 'help' && 'text-muted-foreground'
              )}
              style={{
                color:
                  messageType === 'error'
                    ? TOKENS.colors.error.text
                    : messageType === 'warning'
                      ? TOKENS.colors.warning.text
                      : messageType === 'success'
                        ? TOKENS.colors.success.text
                        : undefined,
              }}
            >
              {message}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Focus Indicator (bottom border animation) */}
      <motion.div
        className="h-0.5 w-full rounded-full"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{
          scaleX: isFocused ? 1 : 0,
          opacity: isFocused ? 1 : 0,
        }}
        transition={SPRING.snappy}
        style={{
          backgroundColor: TOKENS.colors.accent.primary,
          transformOrigin: 'left',
        }}
      />
    </motion.div>
  );
}

/**
 * Pre-configured variants for common field types
 */
export const FormFieldVariants = {
  text: (props: AnimatedFormFieldProps) => (
    <AnimatedFormField {...props} showCharCount={props.maxLength !== undefined}>
      {props.children}
    </AnimatedFormField>
  ),
  textarea: (props: AnimatedFormFieldProps) => (
    <AnimatedFormField {...props} showCharCount={props.maxLength !== undefined}>
      {props.children}
    </AnimatedFormField>
  ),
  select: (props: AnimatedFormFieldProps) => (
    <AnimatedFormField {...props}>{props.children}</AnimatedFormField>
  ),
};