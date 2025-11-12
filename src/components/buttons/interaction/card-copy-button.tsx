'use client';

/**
 * Card Copy Button
 * Copies content URL to clipboard
 */

import { useState } from 'react';
import { Button } from '@/src/components/primitives/button';
import type { CategoryId } from '@/src/lib/config/category-config';
import { trackInteraction } from '@/src/lib/edge/client';
import { Check, Copy } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { SEMANTIC_COLORS } from '@/src/lib/semantic-colors';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { ButtonStyleProps } from '../shared/button-types';

export interface CardCopyButtonProps extends ButtonStyleProps {
  url: string;
  category: CategoryId;
  slug: string;
  title: string;
}

export function CardCopyButton({
  url,
  category,
  slug,
  title,
  size = 'sm',
  buttonVariant = 'ghost',
  className,
  disabled = false,
}: CardCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      trackInteraction({
        interaction_type: 'copy',
        content_type: category,
        content_slug: slug,
      }).catch(() => {
        // Analytics failures should not affect UX
      });

      toasts.success.linkCopied();
    } catch (error) {
      logger.error(
        'Failed to copy link to clipboard',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'CardCopyButton',
          category,
          slug,
        }
      );
      toasts.error.copyFailed('link');
    }
  };

  return (
    <Button
      variant={buttonVariant}
      size={size}
      className={cn(UI_CLASSES.ICON_BUTTON_SM, className)}
      onClick={handleCopy}
      disabled={disabled}
      aria-label={copied ? 'Link copied to clipboard' : `Copy link to ${title}`}
    >
      {copied ? (
        <Check className={cn(UI_CLASSES.ICON_XS, SEMANTIC_COLORS.SOCIAL_COPY)} aria-hidden="true" />
      ) : (
        <Copy className={UI_CLASSES.ICON_XS} aria-hidden="true" />
      )}
    </Button>
  );
}
