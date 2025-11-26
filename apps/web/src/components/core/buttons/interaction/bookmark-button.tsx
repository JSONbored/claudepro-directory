'use client';

/** Bookmark button - adds/removes content from user bookmarks with optional confetti */

import type { Database } from '@heyclaude/database-types';
import { addBookmark } from '@heyclaude/web-runtime/actions/add-bookmark';
import { checkConfettiEnabled } from '@heyclaude/web-runtime/actions/feature-flags';
import { removeBookmark } from '@heyclaude/web-runtime/actions/remove-bookmark';
import { isValidCategory, logClientWarning } from '@heyclaude/web-runtime/core';
import { useLoggedAsync, usePulse } from '@heyclaude/web-runtime/hooks';
import { Bookmark, BookmarkCheck } from '@heyclaude/web-runtime/icons';
import type { ButtonStyleProps } from '@heyclaude/web-runtime/types/component.types';
import { cn, toasts, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/src/components/primitives/ui/button';
import { useConfetti } from '@/src/hooks/use-confetti';

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
                    logClientWarning('BookmarkButton: bookmark removal tracking failed', error, {
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
                    logClientWarning('BookmarkButton: bookmark addition tracking failed', error, {
                      contentType,
                      contentSlug,
                    });
                  });

                // Confetti animation gated by feature flag
                const confettiResult = await checkConfettiEnabled({});
                if (confettiResult) {
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
