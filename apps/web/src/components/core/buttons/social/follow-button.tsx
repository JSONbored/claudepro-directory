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

import { toggleFollow } from '@heyclaude/web-runtime/actions/user';
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks/use-authenticated-user';
import { useSafeAction } from '@heyclaude/web-runtime/hooks/use-safe-action';
import { Button, toasts } from '@heyclaude/web-runtime/ui';
import { usePathname } from 'next/navigation';
import { useCallback, useOptimistic } from 'react';
import { toast } from 'sonner';

import { useAuthModal } from '@/src/hooks/use-auth-modal';

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
  const [optimisticIsFollowing, setOptimisticIsFollowing] = useOptimistic(
    initialIsFollowing,
    (_, newState: boolean) => newState
  );
  const { user, status } = useAuthenticatedUser({ context: 'FollowButton' });
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();
  
  // Use useSafeAction hook - this properly infers types from next-safe-action
  const { executeAsync, isPending } = useSafeAction(toggleFollow, {
    onSuccess: ({ data }: { data?: { success: boolean | null } }) => {
      if (data?.success) {
        toast.success(optimisticIsFollowing ? 'Unfollowed user' : 'Following user');
      }
    },
    onError: ({ error }: { error: { serverError?: string; validationErrors?: unknown } }) => {
      // Rollback optimistic update on error
      setOptimisticIsFollowing(initialIsFollowing);
      
      const errorMessage = error.serverError || 'Failed to update follow status';
      
      // Check if error is auth-related and show modal if so
      if (errorMessage.includes('signed in') || errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        openAuthModal({
          valueProposition: 'Sign in to follow users',
          redirectTo: pathname ?? undefined,
        });
      } else {
        // Non-auth errors - show toast with retry option
        toasts.raw.error(errorMessage, {
          action: {
            label: 'Retry',
            onClick: () => {
              handleToggleFollow();
            },
          },
        });
      }
    },
  });

  const handleToggleFollow = useCallback(() => {
    // Proactive auth check - show modal before attempting action
    if (status === 'loading') {
      // Wait for auth check to complete
      return;
    }

    if (!user) {
      // User is not authenticated - show auth modal
      openAuthModal({
        valueProposition: 'Sign in to follow users',
        redirectTo: pathname ?? undefined,
      });
      return;
    }

    // User is authenticated - proceed with follow action
    // Optimistic update (only after auth check passes)
    const newState = !optimisticIsFollowing;
    setOptimisticIsFollowing(newState);

    // Execute the action using useSafeAction's executeAsync
    executeAsync({
      user_id: userId,
      slug: userSlug,
      action: newState ? 'follow' : 'unfollow',
    });
  }, [user, status, openAuthModal, pathname, optimisticIsFollowing, setOptimisticIsFollowing, userId, userSlug, executeAsync]);

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