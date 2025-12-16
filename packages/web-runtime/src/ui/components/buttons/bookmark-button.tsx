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
 * - Persists bookmarks to database via API routes (/api/bookmarks/add, /api/bookmarks/remove)
 * - Shows confetti celebration on bookmark add (if enabled in config)
 * - Tracks bookmark events with analytics
 * - Displays loading spinner during async operations
 * - Automatically refreshes router after state change
 *
 * @see /api/bookmarks/add API route for adding bookmarks
 * @see /api/bookmarks/remove API route for removing bookmarks
 */

import { checkConfettiEnabled } from '../../../config/static-configs.ts';
// Import directly from source files to avoid indirect imports through entries/core.ts
// which exports from data.ts, potentially causing Turbopack module resolution issues
import { isValidCategory } from '../../../utils/category-validation.ts';
import { logClientWarn } from '../../../utils/client-logger.ts';
import { normalizeError } from '../../../errors.ts';
import { useAuthenticatedUser, useLoggedAsync, usePulse, useConfetti } from '../../../hooks/index.ts';
import { Bookmark, BookmarkCheck, Loader2 } from '../../../icons.tsx';
import type { ButtonStyleProps } from '../../../types/component.types.ts';
import { cn } from '../../../ui/utils.ts';
import { iconSize, size as textSize, weight } from '../../../design-system/index.ts';
import { toasts } from '../../../client/toast.ts';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '../button.tsx';
import { AnimatePresence, motion } from 'motion/react';
import { MICROINTERACTIONS } from '../../../design-system/index.ts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip.tsx';
import type { content_category } from '@heyclaude/data-layer/prisma';

/**
 * BookmarkButton Props
 *
 * @property {content_category} contentType - Content category (mcp, agents, hooks, etc.)
 * @property {string} contentSlug - Unique slug for the content item
 * @property {boolean} [initialBookmarked=false] - Initial bookmarked state (from server)
 * @property {boolean} [showLabel=false] - Show "Save"/"Saved" label next to icon
 * @property {() => void} [onAuthRequired] - Optional callback when authentication is required (opens auth modal if provided)
 * @property {ButtonStyleProps} - Standard button styling props (variant, size, className, disabled)
 */
export interface BookmarkButtonProps extends ButtonStyleProps {
  contentType: content_category;
  contentSlug: string;
  initialBookmarked?: boolean;
  showLabel?: boolean;
  /** Optional callback when authentication is required. If provided, opens auth modal instead of showing toast. */
  onAuthRequired?: () => void;
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
  onAuthRequired,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const { celebrateBookmark } = useConfetti();
  const pulse = usePulse();
  const { user, status } = useAuthenticatedUser({ context: 'BookmarkButton' });
  const runLoggedAsync = useLoggedAsync({
    scope: 'BookmarkButton',
    defaultMessage: 'Bookmark operation failed',
    defaultRethrow: false,
  });

  const handleToggle = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (!isValidCategory(contentType)) {
      toasts.error.fromError(new Error(`Invalid content type: ${contentType}`));
      return;
    }

    // Proactive auth check - show modal before attempting action
    if (status === 'loading') {
      // Wait for auth check to complete
      return;
    }

    if (!user) {
      // User is not authenticated - show auth modal or toast
      if (onAuthRequired) {
        // Use provided callback (opens auth modal)
        onAuthRequired();
      } else {
        // Fallback to toast with redirect (for backwards compatibility)
        toasts.raw.error('Please sign in to bookmark content', {
          action: {
            label: 'Sign In',
            onClick: () => {
              window.location.href = `/login?redirect=${window.location.pathname}`;
            },
          },
        });
      }
      return;
    }

    // User is authenticated - proceed with bookmark action
    const validatedCategory = contentType as content_category;

    startTransition(async () => {
      try {
        if (isBookmarked) {
          await runLoggedAsync(
            async () => {
              // Use API route instead of server action to avoid HMR issues
              const response = await fetch('/api/bookmarks/remove', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  content_type: validatedCategory,
                  content_slug: contentSlug,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `API returned ${response.status}`);
              }

              const result = await response.json();

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
                    logClientWarn('BookmarkButton: bookmark removal tracking failed', normalized, 'BookmarkButton.handleToggle', {
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
              // Use API route instead of server action to avoid HMR issues
              const response = await fetch('/api/bookmarks/add', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  content_type: validatedCategory,
                  content_slug: contentSlug,
                  notes: '',
                }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `API returned ${response.status}`);
              }

              const result = await response.json();

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
                    logClientWarn('BookmarkButton: bookmark addition tracking failed', normalized, 'BookmarkButton.handleToggle', {
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
        // Handle auth errors (fallback - should not reach here if proactive check works)
        if (error instanceof Error && error.message.includes('signed in')) {
          if (onAuthRequired) {
            // Use provided callback (opens auth modal)
            onAuthRequired();
          } else {
            // Fallback to toast with redirect (for backwards compatibility)
            toasts.raw.error('Please sign in to bookmark content', {
              action: {
                label: 'Sign In',
                onClick: () => {
                  window.location.href = `/login?redirect=${window.location.pathname}`;
                },
              },
            });
          }
        } else {
          // Non-auth errors (network, server, etc.)
          normalizeError(error, 'Failed to update bookmark'); // Normalize for logging
          // Show error toast with "Retry" button
          toasts.raw.error('Failed to update bookmark', {
            action: {
              label: 'Retry',
              onClick: () => {
                handleToggle();
              },
            },
          });
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
            className={cn('h-7 w-7 p-0', className)}
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
                  <Loader2 className={`${iconSize.xs} animate-spin`} aria-hidden="true" />
                </motion.div>
              ) : isBookmarked ? (
                <motion.div
                  key="bookmarked"
                  initial={MICROINTERACTIONS.iconTransition.initial}
                  animate={MICROINTERACTIONS.iconTransition.animate}
                  exit={MICROINTERACTIONS.iconTransition.exit}
                  transition={MICROINTERACTIONS.iconTransition.transition}
                  className="text-color-accent-primary"
                >
                  <BookmarkCheck
                    className={`${iconSize.xs} fill-current`}
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
                  <Bookmark className={iconSize.xs} aria-hidden="true" />
                </motion.div>
              )}
            </AnimatePresence>
            {showLabel && !isPending && (
              <span className={`ml-1 ${textSize.sm} ${weight.semibold}`}>{isBookmarked ? 'Saved' : 'Save'}</span>
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
