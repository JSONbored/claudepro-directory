'use client';

/**
 * Bookmark Button Component
 * Toggle bookmark on/off for any content
 *
 * Follows existing patterns from card-copy-action.tsx
 */

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/src/components/ui/button';
import { addBookmark, removeBookmark } from '@/src/lib/actions/bookmark-actions';
import { Bookmark, BookmarkCheck } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { ContentCategory } from '@/src/lib/schemas/shared.schema';
import {
  showAuthRequiredToast,
  showBookmarkError,
  showBookmarkSuccess,
} from '@/src/lib/utils/toast-helpers';

/**
 * Type guard to validate ContentCategory at runtime
 * Ensures only valid content types are passed to bookmark actions
 */
const VALID_CONTENT_CATEGORIES: readonly ContentCategory[] = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'guides',
  'tutorials',
  'comparisons',
  'workflows',
  'use-cases',
  'troubleshooting',
  'categories',
  'collections',
  'jobs',
  'changelog',
] as const;

function isContentCategory(value: string): value is ContentCategory {
  return VALID_CONTENT_CATEGORIES.includes(value as ContentCategory);
}

interface BookmarkButtonProps {
  contentType: string;
  contentSlug: string;
  initialBookmarked?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function BookmarkButton({
  contentType,
  contentSlug,
  initialBookmarked = false,
  showLabel = false,
  className,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card navigation

    // Validate content type at runtime using type guard
    if (!isContentCategory(contentType)) {
      logger.error(
        'Invalid content type provided to BookmarkButton',
        new Error('Invalid content type'),
        {
          contentType,
          contentSlug,
        }
      );
      showBookmarkError(new Error(`Invalid content type: ${contentType}`));
      return;
    }

    startTransition(async () => {
      try {
        if (isBookmarked) {
          // Remove bookmark - type is now validated by type guard
          const result = await removeBookmark({
            content_type: contentType,
            content_slug: contentSlug,
          });

          if (result?.data?.success) {
            setIsBookmarked(false);
            showBookmarkSuccess(false);
          }
        } else {
          // Add bookmark - type is now validated by type guard
          const result = await addBookmark({
            content_type: contentType,
            content_slug: contentSlug,
          });

          if (result?.data?.success) {
            setIsBookmarked(true);
            showBookmarkSuccess(true);
          }
        }

        // Refresh to update UI
        router.refresh();
      } catch (error) {
        // Check if it's an auth error
        if (error instanceof Error && error.message.includes('signed in')) {
          showAuthRequiredToast('Please sign in to bookmark content', window.location.pathname);
        } else {
          showBookmarkError(error instanceof Error ? error : undefined);
        }
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-7 w-7 p-0 ${className}`}
      onClick={handleToggle}
      disabled={isPending}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-3 w-3 fill-current text-primary" aria-hidden="true" />
      ) : (
        <Bookmark className="h-3 w-3" aria-hidden="true" />
      )}
      {showLabel && <span className="ml-1 text-xs">{isBookmarked ? 'Saved' : 'Save'}</span>}
    </Button>
  );
}
