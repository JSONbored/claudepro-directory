'use client';

import { getTimeoutConfig } from '@heyclaude/web-runtime/data';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { type ButtonStyleProps } from '@heyclaude/web-runtime/types/component.types';
import { toasts, Button } from '@heyclaude/web-runtime/ui';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

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

      let resetDelay = 2000;
      try {
        const result = await getTimeoutConfig();
        if (result) {
          resetDelay = result['timeout.ui.clipboard_reset_delay_ms'];
        }
      } catch (configError) {
        const normalizedConfigError = normalizeError(configError, 'Failed to load timeout config');
        logClientWarn(
          '[Config] Failed to load timeout config',
          normalizedConfigError,
          'SimpleCopyButton.handleCopy',
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
      setTimeout(() => setCopied(false), resetDelay);
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
      {showIcon ? (
        copied ? (
          <Check className={iconClassName} aria-hidden="true" />
        ) : (
          <Copy className={iconClassName} aria-hidden="true" />
        )
      ) : null}
      {label ? (copied ? 'Copied!' : label) : null}
    </Button>
  );
}
