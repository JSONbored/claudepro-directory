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

import { toggleFollow } from '@heyclaude/web-runtime/actions';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/src/components/primitives/ui/button';

export interface FollowButtonProps {
  userId: string;
  userSlug: string;
  initialIsFollowing: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

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
    defaultRethrow: false,
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
        // Rollback on exception (error already logged by useLoggedAsync)
        setOptimisticIsFollowing(!newState);
        toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
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
