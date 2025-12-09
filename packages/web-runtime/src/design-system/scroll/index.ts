/**
 * Scroll-Linked Animations
 *
 * Scroll-triggered animation presets using Motion.dev's scroll() function.
 * Provides scroll progress, scroll-linked transforms, and parallax effects.
 *
 * Architecture:
 * - Uses Motion.dev's scroll() for scroll-linked animations
 * - Optimized for performance (compositor-friendly transforms)
 * - Respects prefers-reduced-motion
 *
 * Usage:
 * ```tsx
 * import { SCROLL_ANIMATIONS } from '@heyclaude/web-runtime/design-system';
 * import { useScroll, useTransform } from 'motion/react';
 *
 * const { scrollYProgress } = useScroll();
 * const opacity = useTransform(scrollYProgress, SCROLL_ANIMATIONS.fadeIn.input, SCROLL_ANIMATIONS.fadeIn.output);
 * ```
 *
 * @module web-runtime/design-system/scroll
 */

// Re-export all as SCROLL_ANIMATIONS for convenience
import { PARALLAX } from './parallax.ts';
import { SCROLL_PRESETS } from './presets.ts';
import { PROGRESS } from './progress.ts';

export * from './presets.ts';
export * from './parallax.ts';
export * from './progress.ts';

/**
 * Complete Scroll Animation Design Tokens
 */
export const SCROLL_ANIMATIONS = {
  parallax: PARALLAX,
  presets: SCROLL_PRESETS,
  progress: PROGRESS,
} as const;
