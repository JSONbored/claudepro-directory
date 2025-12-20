/**
 * useMotionValue Hook
 *
 * Creates a MotionValue that can be manually updated and used to drive animations.
 * MotionValues are reactive values that can be subscribed to and transformed.
 *
 * @module web-runtime/hooks/motion/use-motion-value
 *
 * @example
 * ```tsx
 * function DraggableComponent() {
 *   const x = useMotionValue(0);
 *   const y = useMotionValue(0);
 *
 *   return (
 *     <motion.div
 *       drag
 *       style={{ x, y }}
 *       onDrag={(_, info) => {
 *         x.set(info.offset.x);
 *         y.set(info.offset.y);
 *       }}
 *     />
 *   );
 * }
 * ```
 */

'use client';

import { useMotionValue as useMotionMotionValue } from 'motion/react';

/**
 * Hook that creates a MotionValue for manual animation control.
 *
 * MotionValues are reactive values that can be:
 * - Set manually: `value.set(100)`
 * - Subscribed to: `value.on('change', callback)`
 * - Transformed: `useTransform(value, ...)`
 * - Used in style props: `style={{ x: value }}`
 *
 * This is a re-export of Motion.dev's useMotionValue for consistency
 * and centralized imports.
 *
 * @param initial - Initial value for the MotionValue
 * @returns A MotionValue that can be updated and subscribed to
 *
 * @see https://motion.dev/docs/react/utilities/use-motion-value
 */
export const useMotionValue = useMotionMotionValue;
