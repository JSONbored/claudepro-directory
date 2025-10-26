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

import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/src/components/primitives/button';
import { toggleFollow } from '@/src/lib/actions/user.actions';
import { logger } from '@/src/lib/logger';

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

  const handleToggleFollow = () => {
    startTransition(async () => {
      // Optimistic update
      const newState = !optimisticIsFollowing;
      setOptimisticIsFollowing(newState);

      try {
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
          logger.error('Follow action failed', new Error(result.serverError), {
            userId,
            action: newState ? 'follow' : 'unfollow',
          });
        } else {
          // Fallback error
          setOptimisticIsFollowing(!newState);
          toast.error('Failed to update follow status');
        }
      } catch (error) {
        // Rollback on exception
        setOptimisticIsFollowing(!newState);
        toast.error('An unexpected error occurred');
        logger.error(
          'Follow action exception',
          error instanceof Error ? error : new Error(String(error)),
          { userId }
        );
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
