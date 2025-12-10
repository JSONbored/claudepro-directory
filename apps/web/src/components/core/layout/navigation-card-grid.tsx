'use client';

/**
 * Navigation Card Grid Component
 * 
 * Responsive grid container for 3D navigation cards.
 * 
 * Layout:
 * - Desktop (xl:): 4 columns × 2 rows = 8 cards
 * - Tablet (md-xl): 2 columns × 4 rows = 8 cards
 * - Mobile: Not used (falls back to normal menu)
 */

import { SPRING } from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { Navigation3DCard, type Navigation3DCardProps } from './navigation-3d-card';

interface NavigationCardGridProps {
  cards: Array<Navigation3DCardProps>;
  className?: string;
}

export function NavigationCardGrid({
  cards,
  className,
}: NavigationCardGridProps) {
  return (
    <div
      className={cn(
        'grid gap-3', // Tighter gap for compact cards
        'grid-cols-2', // Tablet/Mobile: 2 columns (2x4 = 8 cards)
        'xl:grid-cols-4', // Desktop: 4 columns (4x2 = 8 cards)
        className
      )}
    >
      {cards.map((card, index) => (
        <motion.div
          key={card.href}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.4,
            delay: index * 0.05, // Stagger by 50ms per card
            ...SPRING.smooth,
          }}
          className="h-[90px] xl:h-[100px]" // Half size - compact fixed height for cards
        >
          <Navigation3DCard {...card} />
        </motion.div>
      ))}
    </div>
  );
}
