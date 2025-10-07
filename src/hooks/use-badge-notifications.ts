/**
 * Badge Notification Hook
 * Checks for newly earned badges and shows toast notifications
 */

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { checkNewBadges } from '@/src/lib/actions/badge-actions';

/**
 * Hook to check for and display badge notifications
 * Call this after actions that might award badges (posts, votes, etc.)
 */
export function useBadgeNotifications() {
  const lastCheckRef = useRef<string>(new Date().toISOString());

  const checkForNewBadges = async () => {
    try {
      const result = await checkNewBadges({ since: lastCheckRef.current });

      if (result?.data?.new_badges && result.data.new_badges.length > 0) {
        // Show toast for each new badge
        for (const badge of result.data.new_badges) {
          toast.success(`🎉 Badge Earned: ${badge.icon || '🏆'} ${badge.name}`, {
            description: badge.description,
            duration: 5000,
          });
        }
      }

      // Update last check time
      lastCheckRef.current = new Date().toISOString();
    } catch (error) {
      // Silently fail - badge notifications shouldn't block user actions
      console.error('Failed to check badges:', error);
    }
  };

  return { checkForNewBadges };
}

/**
 * Auto-check for new badges on mount and periodically
 * Use this on pages where users might earn badges
 */
export function useAutoBadgeCheck(enabled = true) {
  const { checkForNewBadges } = useBadgeNotifications();

  useEffect(() => {
    if (!enabled) return;

    // Check on mount
    checkForNewBadges();

    // Check every 30 seconds
    const interval = setInterval(checkForNewBadges, 30000);

    return () => clearInterval(interval);
  }, [enabled, checkForNewBadges]);

  return { checkForNewBadges };
}
