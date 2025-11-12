'use client';

/**
 * Download Markdown Button
 * Downloads markdown file from edge function
 */

import { motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/src/components/primitives/ui/button';
import { useButtonSuccess } from '@/src/hooks/use-button-success';
import { trackUsage } from '@/src/lib/actions/content.actions';
import type { CategoryId } from '@/src/lib/config/category-config';
import { Check, Download } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { SEMANTIC_COLORS } from '@/src/lib/semantic-colors';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { ButtonStyleProps } from '../shared/button-types';

export interface DownloadMarkdownButtonProps extends ButtonStyleProps {
  category: CategoryId;
  slug: string;
  label?: string;
  showIcon?: boolean;
}

export function DownloadMarkdownButton({
  category,
  slug,
  label = 'Download Markdown',
  size = 'sm',
  buttonVariant = 'outline',
  className,
  showIcon = true,
  disabled = false,
}: DownloadMarkdownButtonProps) {
  const { isSuccess, triggerSuccess } = useButtonSuccess();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        `/${category}/${slug}.md?includeMetadata=true&includeFooter=true`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.statusText}`);
      }

      const markdown = await response.text();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="([^"]+)"/)?.[1] || `${slug}.md`;

      if (!markdown) {
        throw new Error('No markdown content returned');
      }

      const blob = new Blob([markdown], {
        type: 'text/markdown;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      triggerSuccess();
      toasts.raw.success('Downloaded successfully!', {
        description: `Saved as ${filename}`,
      });

      trackUsage({
        content_type: category,
        content_slug: slug,
        action_type: 'download_markdown',
      }).catch(() => {
        // Analytics failures should not affect UX
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Download markdown failed', err, { category, slug });
      toasts.raw.error('Failed to download', { description: err.message });
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
            <Download className={UI_CLASSES.ICON_SM} />
          ))}
        {size !== 'icon' && <span>{isSuccess ? 'Downloaded!' : label}</span>}
      </Button>
    </motion.div>
  );
}
