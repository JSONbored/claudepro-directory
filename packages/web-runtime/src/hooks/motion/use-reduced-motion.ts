/**
 * useReducedMotion Hook
 * 
 * Returns true if the current device has Reduced Motion setting enabled.
 * This hook actively responds to changes and re-renders components with the latest setting.
 * 
 * Use this to implement accessibility-compliant animations that respect user preferences.
 * 
 * @module web-runtime/hooks/motion/use-reduced-motion
 * 
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const shouldReduceMotion = useReducedMotion();
 *   
 *   return (
 *     <motion.div
 *       animate={shouldReduceMotion
 *         ? { opacity: 1 }  // Only opacity, no transforms
 *         : { x: 100, opacity: 1, scale: 1.1 }  // Full animation
 *       }
 *     />
 *   );
 * }
 * ```
 */

'use client';

import { useReducedMotion as useMotionReducedMotion } from 'motion/react';

/**
 * Hook that returns true if the current device has Reduced Motion setting enabled.
 * 
 * This is a wrapper around Motion.dev's `useReducedMotion` hook for consistency
 * and to provide a centralized import path.
 * 
 * @returns `true` if reduced motion is enabled, `false` otherwise
 * 
 * @see https://motion.dev/docs/react/utilities/use-reduced-motion
 */
export function useReducedMotion(): boolean {
  return useMotionReducedMotion() ?? false;
}
