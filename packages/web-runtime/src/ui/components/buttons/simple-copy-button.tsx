'use client';

/**
 * SimpleCopyButton Component
 *
 * Generic copy-to-clipboard button with visual feedback
 * Uses web-runtime utilities for logging and configuration
 */

import { logger, normalizeError } from '../../../entries/core.ts';
import { TIMEOUT_CONFIG_CLIENT_DEFAULTS } from '../../../config/client-defaults.ts';
import type { ButtonStyleProps } from '../../../types/component.types.ts';
import { toasts } from '../../../client/toast.ts';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../button.tsx';

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

      // Use client-safe defaults (no async config loading needed for this component)
      const resetDelay = TIMEOUT_CONFIG_CLIENT_DEFAULTS['timeout.ui.clipboard_reset_delay_ms'];
      setTimeout(() => setCopied(false), resetDelay);
    } catch (error) {
      const normalized = normalizeError(error, 'SimpleCopyButton: clipboard write failed');
      logger.error('SimpleCopyButton: clipboard write failed', normalized, {
        component: 'SimpleCopyButton',
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
