/**
 * Design Tokens Index
 *
 * Central export point for all design tokens.
 * Provides semantic, type-safe design tokens for the entire application.
 *
 * Architecture:
 * - Organized by domain (microinteractions, animations, colors, etc.)
 * - Semantic naming (describes purpose, not implementation)
 * - Type-safe with const assertions
 * - Motion.dev compatible
 *
 * Usage:
 * ```tsx
 * import { MICROINTERACTIONS, ANIMATIONS } from '@heyclaude/web-runtime/ui/design-tokens';
 *
 * <motion.button
 *   whileHover={MICROINTERACTIONS.button.hover}
 *   whileTap={MICROINTERACTIONS.button.tap}
 *   transition={ANIMATIONS.spring.smooth}
 * />
 * ```
 *
 * @module web-runtime/ui/design-tokens
 */

export * from './microinteractions.ts';
export * from './animations.ts';
export * from './submission-form.ts';

// Re-export design system tokens for convenience
export { SCROLL_ANIMATIONS, VIEWPORT } from '../../design-system/scroll/index.ts';
export { STAGGER } from '../../design-system/animations/stagger.ts';
export { TEXT_ANIMATIONS } from '../../design-system/text/index.ts';

/**
 * Re-export for convenience
 * Allows importing from '@heyclaude/web-runtime/ui/design-tokens'
 */
export { MICROINTERACTIONS } from './microinteractions.ts';
export { ANIMATIONS } from './animations.ts';
export { SUBMISSION_FORM_TOKENS } from './submission-form.ts';
