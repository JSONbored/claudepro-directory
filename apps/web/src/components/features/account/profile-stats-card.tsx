'use client';

/**
 * Profile Stats Card Component
 * 
 * Client component for user profile stats with animated counters
 */

import { motion } from 'motion/react';
import { MICROINTERACTIONS, SPRING, spaceY, size, between, muted } from '@heyclaude/web-runtime/design-system';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  NumberTicker,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { useInView } from 'motion/react';
import { useRef } from 'react';

export interface ProfileStatsCardProps {
  /**
   * Title for the stats card
   */
  title: string;

  /**
   * Array of stat items to display
   */
  stats: Array<{
    label: string;
    value: number | string;
    animated?: boolean;
  }>;
}

/**
 * Profile stats card with animated counters
 */
export function ProfileStatsCard({ title, stats }: ProfileStatsCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={
        isInView
          ? shouldReduceMotion
            ? { opacity: 1 }
            : { opacity: 1, y: 0 }
          : shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 20 }
      }
      transition={SPRING.smooth}
      whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.card.hover}
      whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.card.tap}
    >
      <Card>
        <CardHeader>
          <CardTitle className={`${size.sm}`}>{title}</CardTitle>
        </CardHeader>
        <CardContent className={`${spaceY.default}`}>
          {stats.map((stat, index) => (
            <div key={stat.label} className={between.center}>
              <span className={`${size.sm} ${muted.default}`}>{stat.label}</span>
              {typeof stat.value === 'number' && stat.animated !== false ? (
                <UnifiedBadge variant="base" style="secondary">
                  <NumberTicker
                    value={stat.value}
                    delay={isInView ? index * 100 : 0}
                    decimalPlaces={0}
                  />
                </UnifiedBadge>
              ) : (
                <UnifiedBadge variant="base" style="secondary">
                  {stat.value}
                </UnifiedBadge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
