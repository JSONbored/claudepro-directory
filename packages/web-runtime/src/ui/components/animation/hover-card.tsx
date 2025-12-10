/**
 * HoverCard - Reusable hover animation wrapper with gentle/strong variants
 * 
 * Enhanced with semantic design tokens for consistent microinteractions.
 * Uses MICROINTERACTIONS.card tokens for hover/tap animations.
 */
'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { MICROINTERACTIONS } from '../../../design-system/index.ts';

interface HoverCardProps {
  children: ReactNode;
  variant?: 'gentle' | 'strong';
  className?: string;
  disabled?: boolean;
}

/**
 * Card hover variants using design tokens
 * Uses OKLCH color space for consistent hover border colors
 */
const VARIANTS = {
  gentle: {
    hover: {
      scale: MICROINTERACTIONS.card.hover.scale,
      rotateX: MICROINTERACTIONS.card.hover.rotateX,
      z: MICROINTERACTIONS.card.hover.z,
      borderColor: 'oklch(74% 0.2 35 / 0.3)', // Subtle orange border (30% opacity)
      transition: MICROINTERACTIONS.card.hover.transition,
    },
    tap: MICROINTERACTIONS.card.tap,
  },
  strong: {
    hover: {
      scale: 1.02,
      rotateX: -12, // Stronger forward tilt
      z: 12, // More forward movement
      borderColor: 'oklch(74% 0.2 35 / 0.5)', // More visible orange border (50% opacity) - matches CARD.hover
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      transition: MICROINTERACTIONS.card.hover.transition,
    },
    tap: MICROINTERACTIONS.card.tap,
  },
} as const;

export function HoverCard({ children, variant = 'gentle', className, disabled }: HoverCardProps) {
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  const config = VARIANTS[variant];

  return (
    <motion.div 
      className={className}
      initial={false}
      whileHover={config.hover} 
      whileTap={config.tap}
      transition={MICROINTERACTIONS.card.transition}
    >
      {children}
    </motion.div>
  );
}
