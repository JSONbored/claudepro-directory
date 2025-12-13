/**
 * useTime Hook
 * 
 * Returns a motion value that updates once per frame with the duration,
 * in milliseconds, since it was first created.
 * 
 * This is especially useful for generating perpetual animations.
 * 
 * This is a direct re-export of Motion.dev's useTime for consistency
 * and centralized imports.
 * 
 * @module web-runtime/hooks/motion/use-time
 * 
 * @example
 * ```tsx
 * import { useTime, useTransform } from '@heyclaude/web-runtime/hooks/motion';
 * 
 * const time = useTime();
 * const rotate = useTransform(
 *   time,
 *   [0, 4000], // Every 4 seconds
 *   [0, 360], // Rotate 360deg
 *   { clamp: false } // Continuous rotation
 * );
 * 
 * return <motion.div style={{ rotate }} />;
 * ```
 * 
 * @example
 * ```tsx
 * // Perpetual color shift
 * const time = useTime();
 * const hue = useTransform(time, [0, 10000], [0, 360], { clamp: false });
 * const backgroundColor = useTransform(hue, (h) => `hsl(${h}, 70%, 50%)`);
 * ```
 * 
 * @see https://motion.dev/docs/react-use-time
 */

'use client';

import { useTime as useTimeOriginal } from 'motion/react';

/**
 * Returns a motion value that updates every frame with the elapsed time
 * in milliseconds since the hook was first called.
 * 
 * Useful for creating perpetual animations that don't depend on user interaction
 * or state changes.
 * 
 * @returns Motion value representing elapsed time in milliseconds
 */
export const useTime = useTimeOriginal;
