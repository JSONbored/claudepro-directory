/**
 * Badge Notification System
 *
 * Displays toast notifications when users earn new badges.
 * Polls for recently earned badges and shows animated notifications with badge details.
 *
 * Production Standards:
 * - Configuration-driven using badges.config.ts
 * - Type-safe with Zod schemas
 * - Performance-optimized with polling and caching
 * - Accessible with ARIA labels
 * - Animated with Motion.dev (Phase 1.5 - 50KB bundle savings)
 * - Theme-aware styling
 * - Uses Sonner for toast notifications
 *
 * @module components/features/badges/badge-notification
 */

'use client';

import { Award, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getRecentlyEarnedBadges } from '@/src/lib/actions/badges.actions';
import {
  BADGE_RARITY_COLORS,
  BADGE_REGISTRY,
  type BadgeDefinition,
} from '@/src/lib/config/badges.config';
import { logger } from '@/src/lib/logger';
import { cn } from '@/src/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface BadgeNotificationProviderProps {
  /** Enable badge notifications */
  enabled?: boolean;
  /** Polling interval in milliseconds (default: 30 seconds) */
  pollingInterval?: number;
  /** User ID to check for badges */
  userId?: string;
  /** Children components */
  children?: React.ReactNode;
}

interface BadgeToastProps {
  /** Badge definition */
  badge: BadgeDefinition;
  /** Earned date */
  earnedAt: Date;
}

// =============================================================================
// BADGE TOAST COMPONENT
// =============================================================================

/**
 * Animated Badge Toast Content
 *
 * Displays badge earned notification with:
 * - Badge icon with sparkle animation
 * - Badge name and description
 * - Rarity indicator
 * - Earned timestamp
 */
const BadgeToastContent = memo(function BadgeToastContent({ badge, earnedAt }: BadgeToastProps) {
  const rarityColors = BADGE_RARITY_COLORS[badge.rarity];

  return (
    <div className="flex items-start gap-3 p-2">
      {/* Animated Badge Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          duration: 0.6,
        }}
        className={cn(
          'relative flex items-center justify-center rounded-full p-3',
          rarityColors.bg,
          rarityColors.border,
          'border-2'
        )}
      >
        {/* Badge Icon */}
        <span className="text-3xl" role="img" aria-label={`${badge.name} icon`}>
          {badge.icon}
        </span>

        {/* Sparkle Effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 2,
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sparkles className={cn('h-8 w-8', rarityColors.text)} />
        </motion.div>
      </motion.div>

      {/* Badge Details */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Badge Earned!</span>
        </div>
        <h4 className={cn('font-bold', rarityColors.text)}>{badge.name}</h4>
        <p className="text-xs text-muted-foreground">{badge.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', rarityColors.bg)}>
            {badge.rarity}
          </span>
          <span className="text-xs text-muted-foreground">
            {earnedAt.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// NOTIFICATION PROVIDER
// =============================================================================

/**
 * Badge Notification Provider
 *
 * Polls for recently earned badges and displays toast notifications.
 * Should be placed high in the component tree (e.g., layout or main app component).
 *
 * Features:
 * - Polls every 30 seconds (configurable)
 * - Tracks last check timestamp to avoid duplicate notifications
 * - Deduplicates badges using Set
 * - Respects user's enabled preference
 * - Cleans up on unmount
 *
 * @example
 * ```tsx
 * <BadgeNotificationProvider enabled={isAuthenticated} userId={currentUserId}>
 *   <YourApp />
 * </BadgeNotificationProvider>
 * ```
 */
export const BadgeNotificationProvider = memo(function BadgeNotificationProvider({
  enabled = false,
  pollingInterval = 30000, // 30 seconds
  userId,
  children,
}: BadgeNotificationProviderProps) {
  const lastCheckRef = useRef<Date>(new Date());
  const shownBadgesRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Check for recently earned badges
   */
  const checkForNewBadges = useCallback(async () => {
    if (!(userId && enabled)) return;

    try {
      const result = await getRecentlyEarnedBadges({
        since: lastCheckRef.current.toISOString(),
      });

      if (result?.data?.badges && result.data.badges.length > 0) {
        const newBadges = result.data.badges.filter(
          (userBadge) => !shownBadgesRef.current.has(userBadge.id)
        );

        for (const userBadge of newBadges) {
          // Look up badge definition from registry
          const badgeDefinition = Object.values(BADGE_REGISTRY).find(
            (def) => def.slug === userBadge.badge?.slug
          );

          if (badgeDefinition) {
            // Show toast notification
            toast(
              <BadgeToastContent
                badge={badgeDefinition}
                earnedAt={new Date(userBadge.earned_at)}
              />,
              {
                duration: 6000, // 6 seconds
                className: 'badge-earned-toast',
              }
            );

            // Track shown badge
            shownBadgesRef.current.add(userBadge.id);
          }
        }
      }

      // Update last check timestamp
      lastCheckRef.current = new Date();
    } catch (error) {
      logger.error(
        'Failed to check for new badges',
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
    }
  }, [userId, enabled]);

  // Set up polling on mount
  useEffect(() => {
    if (!(enabled && userId)) return;

    // Check immediately on mount
    checkForNewBadges().catch(() => {
      // Error already logged in checkForNewBadges
    });

    // Set up polling interval
    intervalRef.current = setInterval(checkForNewBadges, pollingInterval);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, userId, pollingInterval, checkForNewBadges]);

  // Return children (this is a provider component)
  return <>{children}</>;
});

// =============================================================================
// HOOK FOR MANUAL BADGE CHECKS
// =============================================================================

/**
 * Hook to manually trigger badge notification check
 *
 * Useful for checking badges immediately after user actions
 * (e.g., after submitting a post, receiving a vote, etc.)
 *
 * @example
 * ```tsx
 * const { checkBadges } = useBadgeNotifications();
 *
 * const handlePostCreated = async () => {
 *   await createPost();
 *   await checkBadges(); // Check if user earned "First Post" badge
 * };
 * ```
 */
export function useBadgeNotifications() {
  const shownBadgesRef = useRef<Set<string>>(new Set());

  const checkBadges = async (since?: Date) => {
    try {
      const result = await getRecentlyEarnedBadges({
        since: since?.toISOString() || new Date(Date.now() - 60000).toISOString(), // Last minute
      });

      if (result?.data?.badges && result.data.badges.length > 0) {
        const newBadges = result.data.badges.filter(
          (userBadge) => !shownBadgesRef.current.has(userBadge.id)
        );

        for (const userBadge of newBadges) {
          const badgeDefinition = Object.values(BADGE_REGISTRY).find(
            (def) => def.slug === userBadge.badge?.slug
          );

          if (badgeDefinition) {
            toast(
              <BadgeToastContent
                badge={badgeDefinition}
                earnedAt={new Date(userBadge.earned_at)}
              />,
              {
                duration: 6000,
                className: 'badge-earned-toast',
              }
            );

            shownBadgesRef.current.add(userBadge.id);
          }
        }

        return newBadges.length;
      }

      return 0;
    } catch (error) {
      logger.error(
        'Failed to check for badges manually',
        error instanceof Error ? error : new Error(String(error))
      );
      return 0;
    }
  };

  return { checkBadges };
}
