'use client';

import { logClientWarning, logger } from '@heyclaude/web-runtime/core';
import { getTimeoutConfig } from '@heyclaude/web-runtime/data';
import type { ButtonStyleProps } from '@heyclaude/web-runtime/types/component.types';
import { toasts } from '@heyclaude/web-runtime/ui';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/src/components/primitives/ui/button';

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

      let resetDelay = 2000;
      try {
        const result = await getTimeoutConfig({});
        if (result?.data) {
          resetDelay = result.data['timeout.ui.clipboard_reset_delay_ms'];
        }
      } catch (configError) {
        logClientWarning('SimpleCopyButton: failed to load timeout config', configError);
      }
      setTimeout(() => setCopied(false), resetDelay);
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      logger.error('SimpleCopyButton: clipboard write failed', normalizedError, {
        hasContent: Boolean(content),
        label: label ?? 'unnamed',
      });
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
