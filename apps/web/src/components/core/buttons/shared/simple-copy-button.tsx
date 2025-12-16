'use client';

import { getTimeoutConfig } from '@heyclaude/web-runtime/data';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { type ButtonStyleProps } from '@heyclaude/web-runtime/types/component.types';
import { toasts, Button } from '@heyclaude/web-runtime/ui';
// COLORS removed - using direct Tailwind utilities
import { Check, Copy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useBoolean, useTimeout } from '@heyclaude/web-runtime/hooks';

interface SimpleCopyButtonProps extends ButtonStyleProps {
  ariaLabel?: string;
  content: string;
  errorMessage?: string;
  iconClassName?: string;
  label?: string;
  onCopySuccess?: () => void;
  showIcon?: boolean;
  successMessage?: string;
}

/**
 * Renders a button that copies the provided text to the clipboard and shows visual success or error feedback.
 *
 * @param props.content - The text content to copy to the clipboard.
 * @param props.label - Visible button label; when omitted the component renders no label text.
 * @param props.successMessage - Message shown on successful copy (default: "Copied to clipboard!").
 * @param props.errorMessage - Message shown when copy fails (default: "Failed to copy").
 * @param props.showIcon - Whether to render the copy/check icon (default: true).
 * @param props.onCopySuccess - Optional callback invoked after a successful copy.
 * @param props.ariaLabel - Accessible label for the button; if omitted a contextual label is derived from `label` and copy state.
 * @param props.iconClassName - CSS class(es) applied to the icon (default: "h-4 w-4").
 * @param props.variant - Button visual variant.
 * @param props.size - Button size.
 * @param props.className - Additional CSS class(es) applied to the button.
 * @param props.disabled - Disables the button when true.
 * @returns A button element that initiates the copy-to-clipboard action and displays transient feedback.
 *
 * @see getTimeoutConfig
 * @see normalizeError
 * @see logClientWarn
 */
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
  const [resetDelay, setResetDelay] = useState(2000);

  // Load timeout config on mount
  useEffect(() => {
    try {
      const result = getTimeoutConfig();
      if (result) {
        const delay = result['timeout.ui.clipboard_reset_delay_ms'];
        if (typeof delay === 'number' && Number.isFinite(delay) && delay > 0) {
          setResetDelay(delay);
        }
      }
    } catch (configError) {
      const normalizedConfigError = normalizeError(configError, 'Failed to load timeout config');
      logClientWarn(
        '[Config] Failed to load timeout config',
        normalizedConfigError,
        'SimpleCopyButton.loadConfig',
        {
          component: 'SimpleCopyButton',
          action: 'load-timeout-config',
          category: 'config',
          recoverable: true,
          hasContent: Boolean(content),
          label: label ?? 'unnamed',
        }
      );
    }
  }, [content, label]);

  // Use useTimeout for automatic reset
  useTimeout(() => {
    if (copied) {
      setCopiedFalse();
    }
  }, copied ? resetDelay : null);

  const handleCopy = async (event?: React.MouseEvent) => {
    event?.stopPropagation(); // Prevent parent click handlers

    try {
      await navigator.clipboard.writeText(content);
      setCopiedTrue();
      toasts.raw.success(successMessage);
      onCopySuccess?.();
    } catch (error) {
      const normalizedError = normalizeError(error, 'Copy operation failed');
      logClientWarn(
        '[Clipboard] Copy failed',
        normalizedError,
        'SimpleCopyButton.handleCopy',
        {
          component: 'SimpleCopyButton',
          action: 'copy',
          category: 'clipboard',
          recoverable: true,
          userRetryable: true,
          hasContent: Boolean(content),
          label: label ?? 'unnamed',
        }
      );
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
      {showIcon ? (
        copied ? (
          <Check className={`${iconClassName} text-color-social-copy-text-dark`} aria-hidden="true" />
        ) : (
          <Copy className={iconClassName} aria-hidden="true" />
        )
      ) : null}
      {label ? (copied ? 'Copied!' : label) : null}
    </Button>
  );
}