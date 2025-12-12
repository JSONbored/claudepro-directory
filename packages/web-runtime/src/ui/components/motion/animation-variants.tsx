/**
 * Animation Variants Utilities
 * 
 * Reusable animation variant configurations that respect reduced motion preferences.
 * 
 * @module web-runtime/ui/components/motion/animation-variants
 */

'use client';

import { useReducedMotion } from '../../../hooks/motion';
import type { Variants } from 'motion/react';

/**
 * Creates fade-in animation variants that respect reduced motion.
 * 
 * @param options - Animation options
 * @returns Animation variants (transition should be passed separately to motion component)
 */
export function useFadeInVariants(options?: {
  y?: number;
}): Variants {
  const shouldReduceMotion = useReducedMotion();
  const { y = 20 } = options || {};

  return {
    initial: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
  };
}

/**
 * Creates scale animation variants that respect reduced motion.
 * 
 * @param options - Animation options
 * @returns Animation variants (transition should be passed separately to motion component)
 */
export function useScaleVariants(options?: {
  scale?: number;
}): Variants {
  const shouldReduceMotion = useReducedMotion();
  const { scale = 0.95 } = options || {};

  return {
    initial: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, scale },
    animate: { opacity: 1, scale: 1 },
  };
}

/**
 * Creates slide animation variants that respect reduced motion.
 * 
 * @param options - Animation options
 * @returns Animation variants (transition should be passed separately to motion component)
 */
export function useSlideVariants(options?: {
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}): Variants {
  const shouldReduceMotion = useReducedMotion();
  const {
    direction = 'up',
    distance = 20,
  } = options || {};

  const directionMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return {
    initial: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, ...directionMap[direction] },
    animate: { opacity: 1, x: 0, y: 0 },
  };
}
