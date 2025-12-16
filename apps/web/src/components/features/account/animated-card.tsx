'use client';

/**
 * Animated Card Wrapper
 * 
 * Client component wrapper that adds hover/tap microinteractions to any Card.
 * This is a simple wrapper that applies motion to the card's container.
 */

import { motion } from 'motion/react';
import { MICROINTERACTIONS } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import type { ReactNode } from 'react';

export interface AnimatedCardProps {
  children: ReactNode;
}

/**
 * Wraps a Card component with motion animations.
 * The Card component itself remains unchanged - this just adds motion to its container.
 */
export function AnimatedCard({ children }: AnimatedCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.card.hover}
      whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.card.tap}
      transition={MICROINTERACTIONS.card.transition}
      className={`block`}
    >
      {children}
    </motion.div>
  );
}
