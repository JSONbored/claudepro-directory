/**
 * usePageInView Hook
 * 
 * Tracks page/document visibility. Returns true when the current page is the user's active tab.
 * Useful for improving performance by pausing animations, video playback, or other activity
 * when the user navigates to another tab, and resuming on return.
 * 
 * This saves CPU cycles, improves battery life, and helps ensure a smooth user experience.
 * 
 * @module web-runtime/hooks/motion/use-page-in-view
 * 
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const isPageInView = usePageInView();
 *   
 *   useAnimationFrame(isPageInView ? updateAnimation : undefined);
 *   
 *   return <div />;
 * }
 * ```
 * 
 * @example
 * ```tsx
 * function VideoPlayer() {
 *   const videoRef = useRef(null);
 *   const isPageInView = usePageInView();
 *   
 *   useEffect(() => {
 *     const video = videoRef.current;
 *     if (!video) return;
 *     
 *     if (isPageInView) {
 *       video.play();
 *     } else {
 *       video.pause();
 *     }
 *   }, [isPageInView]);
 *   
 *   return <video ref={videoRef} />;
 * }
 * ```
 */

'use client';

import { usePageInView as useMotionPageInView } from 'motion/react';

/**
 * Hook that returns true when the current page is the user's active tab.
 * 
 * Defaults to true on the server and initial client render before a measurement can be made.
 * 
 * @returns `true` when page is visible, `false` when tab is hidden
 * 
 * @see https://motion.dev/docs/react/utilities/use-page-in-view
 */
export function usePageInView(): boolean {
  return useMotionPageInView();
}
