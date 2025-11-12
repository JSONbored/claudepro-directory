'use client';

/**
 * Generic Async Action Button
 * Reusable button for any async operation with loading/success states
 */

import { motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/src/components/primitives/ui/button';
import { useButtonSuccess } from '@/src/hooks/use-button-success';
import { Check, type LucideIcon } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { SEMANTIC_COLORS } from '@/src/lib/semantic-colors';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { AsyncActionHelpers, ButtonStyleProps } from './button-types';

export interface AsyncActionButtonProps extends ButtonStyleProps {
  label: string;
  loadingLabel?: string;
  successLabel?: string;
  icon: LucideIcon;
  showIcon?: boolean;
  ariaLabel: string;
  ariaLabelSuccess: string;
  title?: string;
  successDuration?: number;
  onClick: (helpers: AsyncActionHelpers) => Promise<void> | void;
}

export function AsyncActionButton({
  label,
  loadingLabel = 'Loading...',
  successLabel = 'Success!',
  icon: Icon,
  size = 'sm',
  variant = 'outline',
  className,
  showIcon = true,
  disabled = false,
  ariaLabel,
  ariaLabelSuccess,
  title,
  successDuration = 2000,
  onClick,
}: AsyncActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { isSuccess, triggerSuccess } = useButtonSuccess(successDuration);

  const showError = (message: string, description?: string) => {
    toasts.raw.error(message, {
      description,
      duration: 4000,
    });
  };

  const showSuccess = (message: string, description?: string) => {
    toasts.raw.success(message, {
      description,
      duration: 3000,
    });
  };

  const logError = (message: string, error: Error, context?: Record<string, unknown>) => {
    logger.error(message, error, {
      component: 'AsyncActionButton',
      ...context,
    });
  };

  const handleClick = async () => {
    if (isLoading || isSuccess || disabled) return;

    try {
      await onClick({
        setLoading: setIsLoading,
        setSuccess: triggerSuccess,
        showError,
        showSuccess,
        logError,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError('Action failed', err);
      showError('Action failed', err.message);
    }
  };

  const currentLabel = isSuccess ? successLabel : isLoading ? loadingLabel : label;
  const currentAriaLabel = isSuccess ? ariaLabelSuccess : ariaLabel;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || isLoading || isSuccess}
      className={cn('gap-2 transition-all', isSuccess && SEMANTIC_COLORS.SUCCESS, className)}
      aria-label={currentAriaLabel}
      title={title}
    >
      {showIcon &&
        (isSuccess ? (
          <Check className={UI_CLASSES.ICON_SM} aria-hidden="true" />
        ) : isLoading ? (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            <Icon className={UI_CLASSES.ICON_SM} aria-hidden="true" />
          </motion.div>
        ) : (
          <Icon className={UI_CLASSES.ICON_SM} aria-hidden="true" />
        ))}
      {size !== 'icon' && <span className="text-sm">{currentLabel}</span>}
    </Button>
  );
}
