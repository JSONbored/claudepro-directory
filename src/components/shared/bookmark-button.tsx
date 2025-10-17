'use client';

/**
 * Bookmark Button Component
 * Toggle bookmark on/off for any content
 *
 * Follows existing patterns from card-copy-action.tsx
 */

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { addBookmark, removeBookmark } from '#lib/actions/user';
import { Button } from '@/src/components/ui/button';
import { Bookmark, BookmarkCheck } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { ContentCategory } from '@/src/lib/schemas/shared.schema';
import { toasts } from '@/src/lib/utils/toast.utils';

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
      toasts.error.fromError(new Error(`Invalid content type: ${contentType}`));
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
            toasts.success.bookmarkRemoved();
          }
        } else {
          // Add bookmark - type is now validated by type guard
          const result = await addBookmark({
            content_type: contentType,
            content_slug: contentSlug,
          });

          if (result?.data?.success) {
            setIsBookmarked(true);
            toasts.success.bookmarkAdded();
          }
        }

        // Refresh to update UI
        router.refresh();
      } catch (error) {
        // Check if it's an auth error
        if (error instanceof Error && error.message.includes('signed in')) {
          toasts.raw.error('Please sign in to bookmark content', {
            action: {
              label: 'Sign In',
              onClick: () => {
                window.location.href = `/login?redirect=${window.location.pathname}`;
              },
            },
          });
        } else {
          toasts.error.fromError(
            error instanceof Error ? error : new Error('Failed to update bookmark')
          );
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
