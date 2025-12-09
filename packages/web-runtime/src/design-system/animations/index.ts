/**
 * Animation Design Tokens
 *
 * Centralized animation configurations for Motion.dev animations.
 * Includes spring physics, duration, easing, and transition presets.
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Type-safe with const assertions
 * - No external dependencies
 * - Motion.dev compatible (Transition type)
 * - Semantic naming (e.g., `spring.smooth` not `spring-300-25`)
 *
 * Usage:
 * ```tsx
 * import { ANIMATIONS } from '@heyclaude/web-runtime/design-system';
 *
 * <motion.div
 *   animate={{ x: 100 }}
 *   transition={ANIMATIONS.spring.smooth}
 * />
 * ```
 *
 * @module web-runtime/design-system/animations
 */

// Re-export all as ANIMATIONS for backward compatibility
import { DURATION } from './duration.ts';
import { EASING } from './easing.ts';
import { SPRING } from './spring.ts';
import { STAGGER } from './stagger.ts';
import { TRANSITIONS } from './transitions.ts';

export * from './spring.ts';
export * from './duration.ts';
export * from './easing.ts';
export * from './transitions.ts';
export * from './stagger.ts';

/**
 * Complete Animation Design Tokens
 * Organized by animation type (spring, duration, easing, transitions, stagger)
 */
export const ANIMATIONS = {
  duration: DURATION,
  easing: EASING,
  spring: SPRING,
  stagger: STAGGER,
  transition: TRANSITIONS,
} as const;

/**
 * Type helper for animations tokens
 */
export type AnimationsTokens = typeof ANIMATIONS;
