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

import { logger, normalizeError } from '../../../entries/core.ts';
import { UI_TIMEOUTS } from '../../../config/unified-config.ts';
import type { ButtonStyleProps } from '../../../types/component.types.ts';
import { toasts } from '../../../client/toast.ts';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async (event?: React.MouseEvent) => {
    event?.stopPropagation(); // Prevent parent click handlers

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toasts.raw.success(successMessage);
      onCopySuccess?.();

      // Use unified config for timeout
      setTimeout(() => setCopied(false), UI_TIMEOUTS.clipboard_reset_delay_ms);
    } catch (error) {
      const normalized = normalizeError(error, 'SimpleCopyButton: clipboard write failed');
      logger.warn({ err: normalized,
        category: 'clipboard',
        component: 'SimpleCopyButton',
        recoverable: true,
        userRetryable: true,
        hasContent: Boolean(content),
        label: label ?? 'unnamed', }, '[Clipboard] Copy failed');
      toasts.raw.error(errorMessage);
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
      {showIcon &&
        (copied ? (
          <Check className={iconClassName} aria-hidden="true" />
        ) : (
          <Copy className={iconClassName} aria-hidden="true" />
        ))}
      {label && (copied ? 'Copied!' : label)}
    </Button>
  );
}
