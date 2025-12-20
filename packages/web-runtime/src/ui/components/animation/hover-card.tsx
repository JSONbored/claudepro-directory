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
 * Uses rgba format for Motion.dev compatibility (oklch colors cannot be animated)
 * oklch(74% 0.2 35) = #F97316 (orange-500)
 */
const VARIANTS = {
  gentle: {
    hover: {
      scale: MICROINTERACTIONS.card.hover.scale,
      rotateX: MICROINTERACTIONS.card.hover.rotateX,
      z: MICROINTERACTIONS.card.hover.z,
      borderColor: 'rgba(249, 115, 22, 0.3)', // oklch(74% 0.2 35 / 0.3) converted to rgba for Motion.dev compatibility
      transition: MICROINTERACTIONS.card.hover.transition,
    },
    tap: MICROINTERACTIONS.card.tap,
  },
  strong: {
    hover: {
      scale: 1.02,
      rotateX: -12, // Stronger forward tilt
      z: 12, // More forward movement
      borderColor: 'rgba(249, 115, 22, 0.5)', // oklch(74% 0.2 35 / 0.5) converted to rgba for Motion.dev compatibility
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
