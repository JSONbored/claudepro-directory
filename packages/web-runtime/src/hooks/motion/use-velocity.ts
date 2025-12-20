/**
 * useVelocity Hook
 *
 * Creates a MotionValue that tracks the velocity of another MotionValue.
 * Useful for momentum-based animations, drag interactions, and physics simulations.
 *
 * @module web-runtime/hooks/motion/use-velocity
 *
 * @example
 * ```tsx
 * function DragWithMomentum() {
 *   const x = useMotionValue(0);
 *   const xVelocity = useVelocity(x);
 *   const scale = useTransform(xVelocity, [-3000, 0, 3000], [2, 1, 2]);
 *
 *   return (
 *     <motion.div
 *       drag="x"
 *       style={{ x, scale }}
 *     />
 *   );
 * }
 * ```
 */

'use client';

import { useVelocity as useMotionVelocity } from 'motion/react';

/**
 * Hook that creates a MotionValue tracking the velocity of another MotionValue.
 *
 * The velocity value updates as the source MotionValue changes, providing
 * real-time velocity information for momentum-based animations.
 *
 * This is a re-export of Motion.dev's useVelocity for consistency
 * and centralized imports.
 *
 * @param motionValue - Source MotionValue to track velocity of
 * @returns A MotionValue representing the velocity of the source
 *
 * @see https://motion.dev/docs/react/utilities/use-velocity
 */
export const useVelocity = useMotionVelocity;
