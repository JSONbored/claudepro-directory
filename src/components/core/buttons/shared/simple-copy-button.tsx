'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/src/components/primitives/ui/button';
import { getTimeoutConfig } from '@/src/lib/actions/feature-flags.actions';
import { logger } from '@/src/lib/logger';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { ButtonStyleProps } from './button-types';

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

      const config = await getTimeoutConfig();
      const resetDelay = (config['timeout.ui.clipboard_reset_delay_ms'] as number) || 2000;
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
