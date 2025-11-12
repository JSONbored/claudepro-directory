'use client';

/**
 * Copy LLMs.txt Button
 * Copies AI-optimized plain text content
 */

import { motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/src/components/primitives/ui/button';
import { useButtonSuccess } from '@/src/hooks/use-button-success';
import { useCopyToClipboard } from '@/src/hooks/use-copy-to-clipboard';
import { trackUsage } from '@/src/lib/actions/content.actions';
import type { CategoryId } from '@/src/lib/config/category-config';
import { Check, Sparkles } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { SEMANTIC_COLORS } from '@/src/lib/semantic-colors';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { ButtonStyleProps } from '../shared/button-types';

export interface CopyLLMsButtonProps extends ButtonStyleProps {
  llmsTxtUrl: string;
  label?: string;
  showIcon?: boolean;
  category?: CategoryId;
  slug?: string;
}

export function CopyLLMsButton({
  llmsTxtUrl,
  label = 'Copy for AI',
  size = 'sm',
  buttonVariant = 'outline',
  className,
  showIcon = true,
  disabled = false,
  category,
  slug,
}: CopyLLMsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { isSuccess, triggerSuccess } = useButtonSuccess();
  const { copy } = useCopyToClipboard({
    context: {
      component: 'CopyLLMsButton',
      action: 'copy_llmstxt',
    },
  });

  const handleClick = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(llmsTxtUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch llms.txt: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();
      await copy(content);

      triggerSuccess();
      toasts.raw.success('Copied to clipboard!', {
        description: 'AI-optimized content ready to paste',
      });

      if (category && slug) {
        trackUsage({
          content_type: category,
          content_slug: slug,
          action_type: 'llmstxt',
        }).catch(() => {
          // Analytics failures should not affect UX
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to fetch llms.txt content', err, { llmsTxtUrl });
      toasts.raw.error('Failed to copy', {
        description: 'Please try again or copy the URL manually',
      });
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
          ) : isLoading ? (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            >
              <Sparkles className={UI_CLASSES.ICON_SM} />
            </motion.div>
          ) : (
            <Sparkles className={UI_CLASSES.ICON_SM} />
          ))}
        {size !== 'icon' && <span>{isSuccess ? 'Copied!' : isLoading ? 'Loading...' : label}</span>}
      </Button>
    </motion.div>
  );
}
