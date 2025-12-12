'use client';

/**
 * Profile Stats Card Component
 * 
 * Client component for user profile stats with animated counters
 */

import { motion } from 'motion/react';
import { MICROINTERACTIONS, SPRING } from '@heyclaude/web-runtime/design-system';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  NumberTicker,
  UnifiedBadge,
  UI_CLASSES,
} from '@heyclaude/web-runtime/ui';
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

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={SPRING.smooth}
      whileHover={MICROINTERACTIONS.card.hover}
      whileTap={MICROINTERACTIONS.card.tap}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.map((stat, index) => (
            <div key={stat.label} className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
              <span className={UI_CLASSES.TEXT_SM_MUTED}>{stat.label}</span>
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
