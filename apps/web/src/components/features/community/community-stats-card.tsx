'use client';

/**
 * Community Stats Card Component
 * 
 * Client component for community stats with animated counters
 */

import { motion } from 'motion/react';
import { MICROINTERACTIONS, SPRING } from '@heyclaude/web-runtime/design-system';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  NumberTicker,
  UI_CLASSES,
} from '@heyclaude/web-runtime/ui';
import {
  Layers,
  MessageCircle,
  Users,
} from '@heyclaude/web-runtime/icons';
import { useInView } from 'motion/react';
import { useRef } from 'react';

/**
 * Icon identifier type for stat cards
 */
export type StatCardIconId = 'layers' | 'message-circle' | 'users';

const ICON_MAP: Record<StatCardIconId, typeof Layers> = {
  'layers': Layers,
  'message-circle': MessageCircle,
  'users': Users,
};

export interface CommunityStatsCardProps {
  /**
   * Icon identifier to display
   */
  iconId: StatCardIconId;

  /**
   * Title for the stat card
   */
  title: string;

  /**
   * Numeric value to animate to
   */
  value: number;

  /**
   * Description text
   */
  description: string;
}

/**
 * Community stats card with animated counter
 */
export function CommunityStatsCard({
  iconId,
  title,
  value,
  description,
}: CommunityStatsCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const Icon = ICON_MAP[iconId];

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
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Icon className="text-primary h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            <NumberTicker
              value={value}
              delay={isInView ? 200 : 0}
              decimalPlaces={0}
            />
          </div>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
