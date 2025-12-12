'use client';

/**
 * Profile Social Stats Component
 * 
 * Client component for displaying follower/following counts with animated counters
 */

import { NumberTicker } from '@heyclaude/web-runtime/ui';
import { Users } from '@heyclaude/web-runtime/icons';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { useInView } from 'motion/react';
import { useRef } from 'react';

export interface ProfileSocialStatsProps {
  /**
   * Follower count
   */
  followerCount: number;

  /**
   * Following count
   */
  followingCount: number;
}

/**
 * Displays follower/following counts with animated counters
 */
export function ProfileSocialStats({
  followerCount,
  followingCount,
}: ProfileSocialStatsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div ref={ref} className="mt-3 flex items-center gap-4 text-sm">
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
        <Users className="h-4 w-4" />
        <NumberTicker
          value={followerCount}
          delay={isInView ? 200 : 0}
          decimalPlaces={0}
        />{' '}
        followers
      </div>
      <span>•</span>
      <div>
        <NumberTicker
          value={followingCount}
          delay={isInView ? 300 : 0}
          decimalPlaces={0}
        />{' '}
        following
      </div>
    </div>
  );
}
