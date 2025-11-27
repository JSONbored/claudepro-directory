'use client';

/**
 * BookmarkButton Component
 *
 * Adds/removes content from user bookmarks with optional confetti
 * Uses web-runtime utilities for actions, logging, and hooks
 */

import type { Database } from '@heyclaude/database-types';
import { addBookmark } from '../../../actions/add-bookmark.generated.ts';
import { checkConfettiEnabled } from '../../../config/static-configs.ts';
import { removeBookmark } from '../../../actions/remove-bookmark.generated.ts';
import { isValidCategory, logClientWarning, normalizeError } from '../../../entries/core.ts';
import { useLoggedAsync, usePulse, useConfetti } from '../../../hooks/index.ts';
import { Bookmark, BookmarkCheck } from '../../../icons.tsx';
import type { ButtonStyleProps } from '../../../types/component.types.ts';
import { cn } from '../../../ui/utils.ts';
import { UI_CLASSES } from '../../../ui/constants.ts';
import { toasts } from '../../../client/toast.ts';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '../button.tsx';

export interface BookmarkButtonProps extends ButtonStyleProps {
  contentType: Database['public']['Enums']['content_category'];
  contentSlug: string;
  initialBookmarked?: boolean;
  showLabel?: boolean;
}

export function BookmarkButton({
  contentType,
  contentSlug,
  initialBookmarked = false,
  showLabel = false,
  size = 'sm',
  variant = 'ghost',
  className,
  disabled = false,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { celebrateBookmark } = useConfetti();
  const pulse = usePulse();
  const runLoggedAsync = useLoggedAsync({
    scope: 'BookmarkButton',
    defaultMessage: 'Bookmark operation failed',
    defaultRethrow: false,
  });

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isValidCategory(contentType)) {
      toasts.error.fromError(new Error(`Invalid content type: ${contentType}`));
      return;
    }

    const validatedCategory = contentType as Database['public']['Enums']['content_category'];

    startTransition(async () => {
      try {
        if (isBookmarked) {
          await runLoggedAsync(
            async () => {
              const result = await removeBookmark({
                content_type: validatedCategory,
                content_slug: contentSlug,
              });

              if (result?.data?.success) {
                setIsBookmarked(false);
                toasts.success.bookmarkRemoved();

                // Track bookmark removal (non-blocking)
                pulse
                  .bookmark({
                    category: validatedCategory,
                    slug: contentSlug,
                    action: 'remove',
                  })
                  .catch((error) => {
                    const normalized = normalizeError(
                      error,
                      'BookmarkButton: bookmark removal tracking failed'
                    );
                    logClientWarning('BookmarkButton: bookmark removal tracking failed', normalized, {
                      component: 'BookmarkButton',
                      contentType,
                      contentSlug,
                    });
                  });
              }
            },
            {
              message: 'Failed to remove bookmark',
              context: { contentType, contentSlug, action: 'remove' },
            }
          );
        } else {
          await runLoggedAsync(
            async () => {
              const result = await addBookmark({
                content_type: validatedCategory,
                content_slug: contentSlug,
                notes: '',
              });

              if (result?.data?.success) {
                setIsBookmarked(true);
                toasts.success.bookmarkAdded();

                // Track bookmark addition (non-blocking)
                pulse
                  .bookmark({
                    category: validatedCategory,
                    slug: contentSlug,
                    action: 'add',
                  })
                  .catch((error) => {
                    const normalized = normalizeError(
                      error,
                      'BookmarkButton: bookmark addition tracking failed'
                    );
                    logClientWarning('BookmarkButton: bookmark addition tracking failed', normalized, {
                      component: 'BookmarkButton',
                      contentType,
                      contentSlug,
                    });
                  });

                // Check confetti enabled (static config)
                const confettiEnabled = checkConfettiEnabled();
                if (confettiEnabled) {
                  celebrateBookmark();
                }
              }
            },
            {
              message: 'Failed to add bookmark',
              context: { contentType, contentSlug, action: 'add' },
            }
          );
        }

        router.refresh();
      } catch (error) {
        // Error already logged by useLoggedAsync
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
      variant={variant}
      size={size}
      className={cn(UI_CLASSES.ICON_BUTTON_SM, className)}
      onClick={handleToggle}
      disabled={disabled || isPending}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {isBookmarked ? (
        <BookmarkCheck
          className={`${UI_CLASSES.ICON_XS} fill-current text-primary`}
          aria-hidden="true"
        />
      ) : (
        <Bookmark className={UI_CLASSES.ICON_XS} aria-hidden="true" />
      )}
      {showLabel && (
        <span className={`ml-1 ${UI_CLASSES.TEXT_BADGE}`}>{isBookmarked ? 'Saved' : 'Save'}</span>
      )}
    </Button>
  );
}
