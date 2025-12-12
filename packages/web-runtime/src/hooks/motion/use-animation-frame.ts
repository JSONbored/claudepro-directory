/**
 * useAnimationFrame Hook
 * 
 * Runs a callback once every animation frame (60fps). Perfect for continuous animations,
 * rotations, progress indicators, and time-based calculations.
 * 
 * @module web-runtime/hooks/motion/use-animation-frame
 * 
 * @example
 * ```tsx
 * function RotatingComponent() {
 *   const ref = useRef(null);
 *   
 *   useAnimationFrame((time) => {
 *     if (ref.current) {
 *       ref.current.style.transform = `rotate(${time * 0.1}deg)`;
 *     }
 *   });
 *   
 *   return <div ref={ref} />;
 * }
 * ```
 * 
 * @example
 * ```tsx
 * function ProgressBar({ progress }) {
 *   const ref = useRef(null);
 *   const isPageInView = usePageInView();
 *   
 *   useAnimationFrame(isPageInView ? (time, delta) => {
 *     if (ref.current) {
 *       const currentProgress = Math.min(progress, time / 1000);
 *       ref.current.style.width = `${currentProgress * 100}%`;
 *     }
 *   } : undefined);
 *   
 *   return <div ref={ref} className="progress-bar" />;
 * }
 * ```
 */

'use client';

import { useAnimationFrame as useMotionAnimationFrame } from 'motion/react';

/**
 * Hook that runs a callback once every animation frame.
 * 
 * The callback receives two arguments:
 * - `time`: Total duration of time since the callback was first called
 * - `delta`: Total duration of time since the last animation frame
 * 
 * If the callback is `undefined`, the animation frame loop is paused.
 * This is useful for pausing animations when the page is not visible.
 * 
 * @param callback - Function to call every animation frame, or `undefined` to pause
 * 
 * @see https://motion.dev/docs/react/utilities/use-animation-frame
 */
export function useAnimationFrame(
  callback: ((time: number, delta: number) => void) | undefined
): void {
  if (callback) {
    useMotionAnimationFrame(callback);
  }
}
