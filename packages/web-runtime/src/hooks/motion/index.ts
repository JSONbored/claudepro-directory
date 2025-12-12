/**
 * Motion Hooks
 * 
 * Centralized exports for all Motion.dev hooks and utilities.
 * These hooks provide accessibility, performance, and UX improvements for animations.
 * 
 * @module web-runtime/hooks/motion
 */

export { useReducedMotion } from './use-reduced-motion';
export { usePageInView } from './use-page-in-view';
export { useAnimateScoped } from './use-animate-scoped';
export { useAnimationFrame } from './use-animation-frame';
export { useDragControls } from './use-drag-controls';

// Re-export Motion.dev hooks that don't need wrappers
export { useInView } from 'motion/react';
export type { UseInViewOptions } from 'motion/react';
