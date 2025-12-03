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
import {
  absolute,
  alignItems,
  cluster,
  display,
  flexGrow,
  height,
  iconSize,
  justify,
  marginTop,
  muted,
  position,
  radius,
  row,
  size,
  spaceY,
  translate,
  pointerEvents,
  transition,
  weight,
  width,
} from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';
import { animation } from '@heyclaude/web-runtime/design-system/tokens';
import { textColor, glowShadow, submissionFormColors } from '@heyclaude/web-runtime/design-system';
import { AnimatePresence, motion } from 'motion/react';
import { type FocusEvent, type ReactNode, useCallback, useState } from 'react';
import { Label } from '@heyclaude/web-runtime/ui';

export type ValidationState = 'idle' | 'valid' | 'invalid' | 'warning';

interface AnimatedFormFieldProps {
  children: ReactNode;
  label: string;
  id: string;
  required?: boolean;
  helpText?: string;
  errorMessage?: string;
  warningMessage?: string;
  successMessage?: string;
  validationState?: ValidationState;
  showCharCount?: boolean;
  currentLength?: number;
  maxLength?: number;
  className?: string;
  fieldClassName?: string;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
}

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
      case 'valid':
        return (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={animation.spring.bouncy}
          >
            <CheckCircle className={cn(iconSize.md, textColor.success)} />
          </motion.div>
        );
      case 'invalid':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={animation.spring.snappy}
          >
            <AlertCircle className={cn(iconSize.md, textColor.error)} />
          </motion.div>
        );
      case 'warning':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={animation.spring.snappy}
          >
            <AlertTriangle className={cn(iconSize.md, textColor.warning)} />
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Get border color value for motion.dev animate (needs actual color value, not Tailwind class)
  const getBorderColor = () => {
    if (isFocused) return submissionFormColors.accent.primary;
    if (!hasInteracted) return submissionFormColors.border.default;

    switch (validationState) {
      case 'valid':
        return submissionFormColors.success.border;
      case 'invalid':
        return submissionFormColors.error.border;
      case 'warning':
        return submissionFormColors.warning.border;
      default:
        return submissionFormColors.border.default;
    }
  };

  // Get glow effect based on state
  const getGlowEffect = () => {
    if (!isFocused && validationState === 'idle') return 'none';

    if (isFocused) return glowShadow.orange;

    switch (validationState) {
      case 'valid':
        return glowShadow.green;
      case 'invalid':
        return glowShadow.red;
      default:
        return 'none';
    }
  };

  return (
    <motion.div
      className={cn(spaceY.compact, className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={animation.spring.smooth}
    >
      {/* Label Row */}
      <div className={`${display.flex} ${alignItems.center} ${justify.between}`}>
        <Label htmlFor={id} className={cluster.snug}>
          <span>{label}</span>
          {required && (
            <span className={textColor.accent}>
              *
            </span>
          )}
        </Label>

        {/* Character Count */}
        {showCharCount && maxLength && (
          <motion.span
            className={cn(
              `${size.xs} ${transition.colors}`,
              currentLength > maxLength * 0.9 && currentLength < maxLength
                ? 'text-warning'
                : currentLength >= maxLength
                  ? 'text-error'
                  : muted.default
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {currentLength} / {maxLength}
          </motion.span>
        )}
      </div>

      {/* Field Container with Validation Icon */}
      <div className={position.relative}>
        <motion.div
          className={cn(
            `${position.relative} ${transition.all}`,
            fieldClassName
          )}
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
            <div className={`${translate.centerY} ${pointerEvents.none} ${absolute.topHalfRight}`}>
              {getValidationIcon()}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Message Row (Help Text / Error / Warning / Success) */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={`${messageType}-${message}`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={animation.spring.smooth}
            className={`${row.compact}`}
          >
            {/* Icon for messages */}
            {messageType === 'error' && (
              <AlertCircle
                className={cn(`${marginTop.micro} ${iconSize.sm} ${flexGrow.shrink0}`, textColor.error)}
              />
            )}
            {messageType === 'warning' && (
              <AlertTriangle
                className={cn(`${marginTop.micro} ${iconSize.sm} ${flexGrow.shrink0}`, textColor.warning)}
              />
            )}
            {messageType === 'success' && (
              <CheckCircle
                className={cn(`${marginTop.micro} ${iconSize.sm} ${flexGrow.shrink0}`, textColor.success)}
              />
            )}
            {messageType === 'help' && (
              <Info className={`${marginTop.micro} ${iconSize.sm} ${flexGrow.shrink0} ${muted.default}`} />
            )}

            {/* Message Text */}
            <span
              className={cn(
                size.sm,
                messageType === 'error' && weight.medium,
                messageType === 'warning' && weight.medium,
                messageType === 'success' && weight.medium,
                messageType === 'help' && muted.default,
                messageType === 'error' && textColor.error,
                messageType === 'warning' && textColor.warning,
                messageType === 'success' && textColor.success
              )}
            >
              {message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Indicator (bottom border animation) */}
      <motion.div
        className={`${height.hairline} ${width.full} ${radius.full}`}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{
          scaleX: isFocused ? 1 : 0,
          opacity: isFocused ? 1 : 0,
        }}
        transition={animation.spring.snappy}
        style={{
          backgroundColor: submissionFormColors.accent.primary,
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
