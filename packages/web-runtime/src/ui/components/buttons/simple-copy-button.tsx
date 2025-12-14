'use client';

/**
 * SimpleCopyButton Component
 *
 * Generic copy-to-clipboard button with visual feedback, loading states,
 * and error handling.
 *
 * @component
 * @example
 * Basic usage:
 * ```tsx
 * <SimpleCopyButton
 *   content="https://example.com/share"
 *   successMessage="Link copied!"
 *   errorMessage="Failed to copy link"
 * />
 * ```
 *
 * @example
 * With custom label and callback:
 * ```tsx
 * <SimpleCopyButton
 *   content={JSON.stringify(config, null, 2)}
 *   label="Copy Config"
 *   successMessage="Configuration copied!"
 *   onCopySuccess={() => console.log('Copied!')}
 *   showIcon={true}
 * />
 * ```
 *
 * @remarks
 * - Uses native Clipboard API
 * - Shows checkmark icon on successful copy (temporary)
 * - Displays toast notifications for success/error
 * - Automatically resets after configured delay
 * - Disables button during "copied" state
 * - Logs copy failures with structured logging
 *
 * @see {@link useCopyToClipboard} Alternative hook-based approach
 */

// Import directly from source files to avoid indirect imports through entries/core.ts
import { logger } from '../../../logger.ts';
import { normalizeError } from '../../../errors.ts';
import { UI_TIMEOUTS } from '../../../config/unified-config.ts';
import type { ButtonStyleProps } from '../../../types/component.types.ts';
import { toasts } from '../../../client/toast.ts';
import { MICROINTERACTIONS } from '../../../design-system/index.ts';
import { COLORS } from '../../../design-tokens/index.ts';
import { Check, Copy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useBoolean, useTimeout } from '@heyclaude/web-runtime/hooks';
import { Button } from '../button.tsx';

/**
 * SimpleCopyButton Props
 *
 * @property {string} content - Content to copy to clipboard
 * @property {string} [label] - Button label text (optional, can be icon-only)
 * @property {string} [successMessage="Copied to clipboard!"] - Toast message on success
 * @property {string} [errorMessage="Failed to copy"] - Toast message on error
 * @property {boolean} [showIcon=true] - Show copy/check icon
 * @property {() => void} [onCopySuccess] - Callback after successful copy
 * @property {string} [ariaLabel] - Accessible label (auto-generated if not provided)
 * @property {string} [iconClassName="h-4 w-4"] - Icon size classes
 * @property {ButtonStyleProps} - Standard button styling props (variant, size, className, disabled)
 */
interface SimpleCopyButtonProps extends ButtonStyleProps {
  content: string;
  label?: string;
  successMessage?: string;
  errorMessage?: string;
  showIcon?: boolean;
  onCopySuccess?: () => void;
  ariaLabel?: string;
  iconClassName?: string;
}

export function SimpleCopyButton({
  content,
  label,
  successMessage = 'Copied to clipboard!',
  errorMessage = 'Failed to copy',
  showIcon = true,
  onCopySuccess,
  ariaLabel,
  iconClassName = 'h-4 w-4',
  variant = 'default',
  size = 'default',
  className,
  disabled,
}: SimpleCopyButtonProps) {
  const { value: copied, setTrue: setCopiedTrue, setFalse: setCopiedFalse } = useBoolean();

  // Reset copy state after timeout when copied is true
  useTimeout(() => {
    if (copied) {
      setCopiedFalse();
    }
  }, copied ? UI_TIMEOUTS.clipboard_reset_delay_ms : null);

  const handleCopy = async (event?: React.MouseEvent) => {
    event?.stopPropagation(); // Prevent parent click handlers

    try {
      await navigator.clipboard.writeText(content);
      setCopiedTrue();
      toasts.raw.success(successMessage);
      onCopySuccess?.();
    } catch (error) {
      const normalized = normalizeError(error, 'SimpleCopyButton: clipboard write failed');
      logger.warn({ err: normalized,
        category: 'clipboard',
        component: 'SimpleCopyButton',
        recoverable: true,
        userRetryable: true,
        hasContent: Boolean(content),
        label: label ?? 'unnamed', }, '[Clipboard] Copy failed');
      // Show error toast with "Retry" button
      toasts.raw.error(errorMessage, {
        action: {
          label: 'Retry',
          onClick: () => {
            handleCopy();
          },
        },
      });
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || copied}
      aria-label={ariaLabel || (copied ? 'Copied to clipboard' : `Copy ${label || 'content'}`)}
    >
      {showIcon && (
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="check"
              initial={MICROINTERACTIONS.iconTransition.initial}
              animate={MICROINTERACTIONS.iconTransition.animate}
              exit={MICROINTERACTIONS.iconTransition.exit}
              transition={MICROINTERACTIONS.iconTransition.transition}
              style={{ color: COLORS.semantic.social.copy.dark.text }}
            >
              <Check className={iconClassName} aria-hidden="true" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={MICROINTERACTIONS.iconTransition.initial}
              animate={MICROINTERACTIONS.iconTransition.animate}
              exit={MICROINTERACTIONS.iconTransition.exit}
              transition={MICROINTERACTIONS.iconTransition.transition}
            >
              <Copy className={iconClassName} aria-hidden="true" />
            </motion.div>
          )}
        </AnimatePresence>
      )}
      {label && (copied ? 'Copied!' : label)}
    </Button>
  );
}
