'use client';

/**
 * FollowButton - Optimistic UI Follow/Unfollow Button
 *
 * Architecture:
 * - Uses server action with optimistic updates
 * - Performance: Instant UI feedback, background sync
 * - Error handling: Rollback on failure with toast notification
 * - Type-safe with Zod validation
 *
 * @module components/features/social/follow-button
 */

import { normalizeError } from '@heyclaude/shared-runtime';
import { toggleFollow } from '@heyclaude/web-runtime/actions';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { Button } from '@heyclaude/web-runtime/ui';
import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';

export interface FollowButtonProps {
  className?: string;
  initialIsFollowing: boolean;
  size?: 'default' | 'icon' | 'lg' | 'sm';
  userId: string;
  userSlug: string;
  variant?: 'default' | 'ghost' | 'outline';
}

/**
 * Render a follow/unfollow button that performs an optimistic toggle, synchronizes the change with the server, and rolls back on error while showing toast notifications.
 *
 * @param userId - The target user's unique identifier sent to the server action.
 * @param userSlug - The target user's slug sent to the server action.
 * @param initialIsFollowing - Initial follow state used for optimistic updates.
 * @param variant - Visual variant of the Button ('default' | 'ghost' | 'outline').
 * @param size - Size of the Button ('default' | 'icon' | 'lg' | 'sm'), defaults to 'sm'.
 * @param className - Optional additional CSS class names applied to the Button.
 * @returns A Button element that displays the optimistic follow state and initiates the follow/unfollow flow when clicked.
 *
 * @see toggleFollow
 * @see useOptimistic
 * @see useLoggedAsync
 * @see normalizeError
 * @see toast
 */
export function FollowButton({
  userId,
  userSlug,
  initialIsFollowing,
  variant,
  size = 'sm',
  className,
}: FollowButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticIsFollowing, setOptimisticIsFollowing] = useOptimistic(
    initialIsFollowing,
    (_, newState: boolean) => newState
  );
  const runLoggedAsync = useLoggedAsync({
    scope: 'FollowButton',
    defaultMessage: 'Follow operation failed',
    defaultRethrow: true, // Re-throw so outer catch can handle rollback
  });

  const handleToggleFollow = () => {
    startTransition(async () => {
      // Optimistic update
      const newState = !optimisticIsFollowing;
      setOptimisticIsFollowing(newState);

      try {
        await runLoggedAsync(
          async () => {
            // Server action
            const result = await toggleFollow({
              user_id: userId,
              slug: userSlug,
              action: newState ? 'follow' : 'unfollow',
            });

            if (result?.data?.success) {
              toast.success(newState ? 'Following user' : 'Unfollowed user');
            } else if (result?.serverError) {
              // Rollback on server error
              setOptimisticIsFollowing(!newState);
              toast.error(result.serverError);
              throw new Error(result.serverError);
            } else {
              // Fallback error
              setOptimisticIsFollowing(!newState);
              throw new Error('Failed to update follow status');
            }
          },
          {
            message: `Failed to ${newState ? 'follow' : 'unfollow'} user`,
            context: { userId, userSlug, action: newState ? 'follow' : 'unfollow' },
          }
        );
      } catch (error) {
        // Error already logged by useLoggedAsync, rollback already done in error paths above
        toast.error(normalizeError(error, 'An unexpected error occurred').message);
      }
    });
  };

  return (
    <Button
      variant={optimisticIsFollowing ? 'outline' : variant || 'default'}
      size={size}
      className={className}
      onClick={handleToggleFollow}
      disabled={isPending}
    >
      {optimisticIsFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}