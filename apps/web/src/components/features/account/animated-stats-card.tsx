'use client';

/**
 * Animated Stats Card Component
 *
 * Client component for dashboard stats cards with:
 * - Animated number counters (NumberTicker)
 * - Hover/tap microinteractions
 * - Scroll-triggered animations
 */

import { motion } from 'motion/react';
import { MICROINTERACTIONS, SPRING } from '@heyclaude/web-runtime/design-system';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  NumberTicker,
  cn,
} from '@heyclaude/web-runtime/ui';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import type { LucideIcon } from 'lucide-react';
import { useInView } from 'motion/react';
import { useRef } from 'react';

export interface AnimatedStatsCardProps {
  /**
   * Title for the stat card
   */
  title: string;

  /**
   * Icon to display (optional)
   */
  icon?: LucideIcon;

  /**
   * Numeric value to animate to (ignored if customContent is provided)
   */
  value?: number;

  /**
   * Suffix for the number (e.g., "+", "K", "M")
   */
  suffix?: string;

  /**
   * Description text below the number
   */
  description: string;

  /**
   * Custom content to render instead of number (e.g., badge)
   * When provided, value and icon are ignored
   */
  customContent?: React.ReactNode;
}

/**
 * Animated stats card with counter animation and hover effects
 */
export function AnimatedStatsCard({
  title,
  icon: Icon,
  value = 0,
  suffix = '',
  description,
  customContent,
}: AnimatedStatsCardProps) {
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
      <Card className="transition-shadow">
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {customContent ? (
            <div className="mt-2">{customContent}</div>
          ) : (
            <div className="flex items-center gap-2">
              {Icon && <Icon className="text-primary h-5 w-5" />}
              <span className="text-3xl font-bold">
                <NumberTicker
                  value={value}
                  delay={isInView ? 200 : 0}
                  suffix={suffix}
                  decimalPlaces={0}
                />
              </span>
            </div>
          )}
          <p className={cn('text-muted-foreground mt-2 text-xs')}>{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
