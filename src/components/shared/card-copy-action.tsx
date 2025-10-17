'use client';

/**
 * Card Copy Action Component
 *
 * Reusable copy-to-clipboard button for card components.
 * Provides consistent behavior with toast notifications and analytics tracking.
 *
 * **Architecture**: Client-only component with no server dependencies.
 * Email capture is handled at a higher level (app/layout level), not here.
 *
 * Used in: ConfigCard, CollectionCard
 */

import { useState } from 'react';
import { trackCopy } from '#lib/actions/track-view';
import { Button } from '@/src/components/ui/button';
import { Check, Copy } from '@/src/lib/icons';
import type { ContentCategory } from '@/src/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { toasts } from '@/src/lib/utils/toast.utils';

export interface CardCopyActionProps {
  /** Full URL to copy to clipboard */
  url: string;
  /** Content category for analytics tracking */
  category: ContentCategory;
  /** Content slug for analytics tracking */
  slug: string;
  /** Display title for aria-label */
  title: string;
  /** Component name for analytics context */
  componentName: string;
}

export function CardCopyAction({ url, category, slug, title }: CardCopyActionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Track copy action for analytics (silent fail)
      trackCopy({ category, slug }).catch(() => {
        // Silent fail - don't break UX
      });

      toasts.success.linkCopied();
    } catch (error) {
      toasts.error.copyFailed('link');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-7 w-7 p-0 ${UI_CLASSES.BUTTON_GHOST_ICON}`}
      onClick={handleCopy}
      aria-label={copied ? 'Link copied to clipboard' : `Copy link to ${title}`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" aria-hidden="true" />
      ) : (
        <Copy className="h-3 w-3" aria-hidden="true" />
      )}
    </Button>
  );
}
