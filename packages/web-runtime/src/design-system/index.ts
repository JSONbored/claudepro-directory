/**
 * Design System v2 - Semantic Design Tokens
 *
 * Central export point for all semantic design tokens.
 * This is the new v2 design system, completely self-contained and independent
 * from the old unified-config patterns.
 *
 * Architecture:
 * - Self-contained semantic values (no external dependencies)
 * - Organized by domain (animations, microinteractions, scroll, layout, text)
 * - Type-safe with const assertions
 * - Motion.dev compatible
 * - Semantic naming (describes purpose, not implementation)
 *
 * Migration Path:
 * - Phase 1: Create new semantic design system (this)
 * - Phase 2-N: Migrate components to use semantic tokens
 * - Final: Remove old unified-config UI_ANIMATION references
 *
 * Usage:
 * ```tsx
 * import { ANIMATIONS, MICROINTERACTIONS, SCROLL_ANIMATIONS } from '@heyclaude/web-runtime/design-system';
 *
 * <motion.button
 *   whileHover={MICROINTERACTIONS.button.hover}
 *   whileTap={MICROINTERACTIONS.button.tap}
 *   transition={ANIMATIONS.spring.smooth}
 * />
 * ```
 *
 * @module web-runtime/design-system
 */

// Animations
export * from './animations/index.ts';
export { ANIMATIONS } from './animations/index.ts';

// Microinteractions
export * from './microinteractions/index.ts';
export { MICROINTERACTIONS } from './microinteractions/index.ts';

// Scroll animations
export * from './scroll/index.ts';
export { SCROLL_ANIMATIONS } from './scroll/index.ts';

// Layout animations
export * from './layout/index.ts';
export { LAYOUT_ANIMATIONS } from './layout/index.ts';

// Text animations
export * from './text/index.ts';
export { TEXT_ANIMATIONS } from './text/index.ts';
