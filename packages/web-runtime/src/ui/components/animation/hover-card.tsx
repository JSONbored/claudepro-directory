/**
 * HoverCard - Reusable hover animation wrapper with gentle/strong variants
 * 
 * Enhanced with semantic design tokens for consistent microinteractions.
 * Uses MICROINTERACTIONS.card tokens for hover/tap animations.
 */
'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { MICROINTERACTIONS } from '../../design-tokens/index.ts';

interface HoverCardProps {
  children: ReactNode;
  variant?: 'gentle' | 'strong';
  className?: string;
  disabled?: boolean;
}

/**
 * Card hover variants using design tokens
 */
const VARIANTS = {
  gentle: {
    hover: {
      scale: MICROINTERACTIONS.card.hover.scale,
      y: MICROINTERACTIONS.card.hover.y,
      borderColor: 'rgba(249, 115, 22, 0.3)', // Subtle orange border
      transition: MICROINTERACTIONS.card.hover.transition,
    },
    tap: MICROINTERACTIONS.card.tap,
  },
  strong: {
    hover: {
      scale: 1.03,
      y: -4,
      borderColor: 'rgba(249, 115, 22, 0.5)', // More visible orange border
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
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
      whileHover={config.hover} 
      whileTap={config.tap}
      transition={MICROINTERACTIONS.card.transition}
    >
      {children}
    </motion.div>
  );
}
