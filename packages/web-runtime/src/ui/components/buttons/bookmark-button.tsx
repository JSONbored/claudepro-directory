'use client';

/**
 * BookmarkButton Component
 *
 * Database-persisted bookmark button with loading states, confetti celebration,
 * and analytics tracking.
 *
 * @component
 * @example
 * ```tsx
 * <BookmarkButton
 *   contentType="mcp"
 *   contentSlug="my-mcp-server"
 *   initialBookmarked={false}
 *   showLabel={true}
 * />
 * ```
 *
 * @remarks
 * - Requires authentication (shows sign-in prompt if not authenticated)
 * - Persists bookmarks to database via server actions
 * - Shows confetti celebration on bookmark add (if enabled in config)
 * - Tracks bookmark events with analytics
 * - Displays loading spinner during async operations
 * - Automatically refreshes router after state change
 *
 * @see {@link addBookmark} Server action for adding bookmarks
 * @see {@link removeBookmark} Server action for removing bookmarks
 */

import type { Database } from '@heyclaude/database-types';
import { addBookmark } from '../../../actions/add-bookmark.generated.ts';
import { checkConfettiEnabled } from '../../../config/static-configs.ts';
import { removeBookmark } from '../../../actions/remove-bookmark.generated.ts';
import { isValidCategory, logClientWarning, normalizeError } from '../../../entries/core.ts';
import { useLoggedAsync, usePulse, useConfetti } from '../../../hooks/index.ts';
import { Bookmark, BookmarkCheck, Loader2 } from '../../../icons.tsx';
import type { ButtonStyleProps } from '../../../types/component.types.ts';
import { cn } from '../../../ui/utils.ts';
import { UI_CLASSES } from '../../../ui/constants.ts';
import { toasts } from '../../../client/toast.ts';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '../button.tsx';
import { AnimatePresence, motion } from 'motion/react';
import { MICROINTERACTIONS } from '../../../design-system/index.ts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip.tsx';

/**
 * BookmarkButton Props
 *
 * @property {Database['public']['Enums']['content_category']} contentType - Content category (mcp, agents, hooks, etc.)
 * @property {string} contentSlug - Unique slug for the content item
 * @property {boolean} [initialBookmarked=false] - Initial bookmarked state (from server)
 * @property {boolean} [showLabel=false] - Show "Save"/"Saved" label next to icon
 * @property {ButtonStyleProps} - Standard button styling props (variant, size, className, disabled)
 */
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
  const pathname = usePathname();
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

        // Only refresh router on account/library pages where bookmark state affects displayed content
        // Skip refresh on homepage and other pages to prevent full page reload
        if (pathname?.startsWith('/account') || pathname?.startsWith('/u/')) {
          router.refresh();
        }
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
          toasts.error.fromError(normalizeError(error, 'Failed to update bookmark'));
        }
      }
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn(UI_CLASSES.ICON_BUTTON_SM, className)}
            onClick={handleToggle}
            disabled={disabled || isPending}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <AnimatePresence mode="wait">
              {isPending ? (
                <motion.div
                  key="loading"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={MICROINTERACTIONS.iconTransition.transition}
                >
                  <Loader2 className={`${UI_CLASSES.ICON_XS} animate-spin`} aria-hidden="true" />
                </motion.div>
              ) : isBookmarked ? (
                <motion.div
                  key="bookmarked"
                  initial={MICROINTERACTIONS.iconTransition.initial}
                  animate={MICROINTERACTIONS.iconTransition.animate}
                  exit={MICROINTERACTIONS.iconTransition.exit}
                  transition={MICROINTERACTIONS.iconTransition.transition}
                  style={{ color: 'var(--claude-orange)' }}
                >
                  <BookmarkCheck
                    className={`${UI_CLASSES.ICON_XS} fill-current`}
                    aria-hidden="true"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="unbookmarked"
                  initial={MICROINTERACTIONS.iconTransition.initial}
                  animate={MICROINTERACTIONS.iconTransition.animate}
                  exit={MICROINTERACTIONS.iconTransition.exit}
                  transition={MICROINTERACTIONS.iconTransition.transition}
                >
                  <Bookmark className={UI_CLASSES.ICON_XS} aria-hidden="true" />
                </motion.div>
              )}
            </AnimatePresence>
            {showLabel && !isPending && (
              <span className={`ml-1 ${UI_CLASSES.TEXT_BADGE}`}>{isBookmarked ? 'Saved' : 'Save'}</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isBookmarked ? 'Remove from library' : 'Save to library'}</p>
          <p className="text-xs text-muted-foreground">
            {isBookmarked ? 'Unsave this item' : 'Requires account'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
