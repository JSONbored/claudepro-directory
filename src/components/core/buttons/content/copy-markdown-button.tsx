'use client';

/**
 * Copy Markdown Button
 * Fetches and copies markdown content from edge function
 */

import { motion } from 'motion/react';
import { useState } from 'react';
import { usePostCopyEmail } from '@/src/components/core/infra/providers/email-capture-modal-provider';
import { Button } from '@/src/components/primitives/ui/button';
import { useButtonSuccess } from '@/src/hooks/use-button-success';
import { useCopyToClipboard } from '@/src/hooks/use-copy-to-clipboard';
import { trackUsage } from '@/src/lib/actions/content.actions';
import type { CategoryId } from '@/src/lib/config/category-config';
import { Check, FileText } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { SEMANTIC_COLORS } from '@/src/lib/semantic-colors';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { ButtonStyleProps } from '../shared/button-types';

export interface CopyMarkdownButtonProps extends ButtonStyleProps {
  category: CategoryId;
  slug: string;
  label?: string;
  showIcon?: boolean;
  includeMetadata?: boolean;
  includeFooter?: boolean;
}

export function CopyMarkdownButton({
  category,
  slug,
  label = 'Copy as Markdown',
  size = 'sm',
  buttonVariant = 'outline',
  className,
  showIcon = true,
  disabled = false,
  includeMetadata = true,
  includeFooter = false,
}: CopyMarkdownButtonProps) {
  const { isSuccess, triggerSuccess } = useButtonSuccess();
  const referrer = typeof window !== 'undefined' ? window.location.pathname : undefined;
  const { showModal } = usePostCopyEmail();
  const { copy } = useCopyToClipboard({
    context: {
      component: 'CopyMarkdownButton',
      action: 'copy_markdown',
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        includeMetadata: includeMetadata.toString(),
        includeFooter: includeFooter.toString(),
      });

      const response = await fetch(`/${category}/${slug}.md?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.statusText}`);
      }

      const markdown = await response.text();

      if (!markdown) {
        throw new Error('No markdown content returned');
      }

      await copy(markdown);
      triggerSuccess();
      toasts.raw.success('Copied to clipboard!', {
        description: 'Markdown content ready to paste',
      });

      trackUsage({
        content_type: category,
        content_slug: slug,
        action_type: 'copy',
      }).catch(() => {
        // Analytics failures should not affect UX
      });

      showModal({
        copyType: 'markdown',
        category,
        slug,
        ...(referrer && { referrer }),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Copy markdown failed', err, { category, slug });
      toasts.raw.error('Failed to copy markdown', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div animate={isSuccess ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 0.3 }}>
      <Button
        variant={buttonVariant}
        size={size}
        onClick={handleClick}
        disabled={disabled || isLoading || isSuccess}
        className={cn('gap-2 transition-all', isSuccess && SEMANTIC_COLORS.SUCCESS, className)}
      >
        {showIcon &&
          (isSuccess ? (
            <Check className={UI_CLASSES.ICON_SM} />
          ) : (
            <FileText className={UI_CLASSES.ICON_SM} />
          ))}
        {size !== 'icon' && <span>{isSuccess ? 'Copied!' : label}</span>}
      </Button>
    </motion.div>
  );
}
