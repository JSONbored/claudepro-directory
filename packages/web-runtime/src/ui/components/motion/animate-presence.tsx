/**
 * AnimatePresence Component
 *
 * Wrapper for Motion.dev's AnimatePresence component.
 * Provides exit animations for components that mount/unmount.
 *
 * @module web-runtime/ui/components/motion/animate-presence
 *
 * @example
 * ```tsx
 * function ToggleableContent({ isVisible }) {
 *   return (
 *     <AnimatePresence>
 *       {isVisible && (
 *         <motion.div
 *           initial={{ opacity: 0 }}
 *           animate={{ opacity: 1 }}
 *           exit={{ opacity: 0 }}
 *         >
 *           Content
 *         </motion.div>
 *       )}
 *     </AnimatePresence>
 *   );
 * }
 * ```
 */

'use client';

import { AnimatePresence as MotionAnimatePresence } from 'motion/react';
import type { AnimatePresenceProps } from 'motion/react';

/**
 * Component that enables exit animations for children.
 *
 * AnimatePresence tracks components as they mount and unmount,
 * allowing exit animations to play before the component is removed.
 *
 * This is a re-export of Motion.dev's AnimatePresence for consistency
 * and centralized imports.
 *
 * @param props - AnimatePresence props (mode, initial, etc.)
 * @returns AnimatePresence wrapper component
 *
 * @see https://motion.dev/docs/react/components/animate-presence
 */
export const AnimatePresence = MotionAnimatePresence;

// Re-export the type for convenience
export type { AnimatePresenceProps };
