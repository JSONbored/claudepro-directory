/**
 * Layout Animations
 *
 * Layout animation configurations for Motion.dev's layout prop.
 * Provides smooth transitions when elements change position or size.
 *
 * Architecture:
 * - Uses Motion.dev's layout prop for automatic layout animations
 * - Optimized for performance (FLIP technique)
 * - Handles position, size, and layout changes
 *
 * Usage:
 * ```tsx
 * import { LAYOUT_ANIMATIONS } from '@heyclaude/web-runtime/design-system';
 *
 * <motion.div layout transition={LAYOUT_ANIMATIONS.smooth}>
 *   {content}
 * </motion.div>
 * ```
 *
 * @module web-runtime/design-system/layout
 */

// Re-export all as LAYOUT_ANIMATIONS for convenience
import { SHARED_ELEMENT } from './shared-element.ts';
import { LAYOUT_TRANSITIONS } from './transitions.ts';

export * from './transitions.ts';
export * from './shared-element.ts';

/**
 * Complete Layout Animation Design Tokens
 */
export const LAYOUT_ANIMATIONS = {
  sharedElement: SHARED_ELEMENT,
  transitions: LAYOUT_TRANSITIONS,
} as const;
