/**
 * Microinteractions Design Tokens
 *
 * Semantic design tokens for all microinteractions, button states, hover effects,
 * and interactive feedback across the application.
 *
 * Architecture:
 * - Semantic naming (e.g., `button.hover.scale` not `scale-1.1`)
 * - Type-safe with const assertions
 * - Organized by component/context (button, icon, card, tooltip)
 * - Motion.dev compatible (spring physics, transitions)
 *
 * Usage:
 * ```tsx
 * import { MICROINTERACTIONS } from '@heyclaude/web-runtime/design-system';
 *
 * <motion.button
 *   whileHover={MICROINTERACTIONS.button.hover}
 *   whileTap={MICROINTERACTIONS.button.tap}
 *   transition={MICROINTERACTIONS.button.transition}
 * />
 * ```
 *
 * @module web-runtime/design-system/microinteractions
 */

// Re-export all as MICROINTERACTIONS for backward compatibility
import { BUTTON } from './button.ts';
import { CARD } from './card.ts';
import { COLOR_TRANSITION } from './color-transition.ts';
import { HERO } from './hero.ts';
import { ICON_BUTTON } from './icon-button.ts';
import { ICON_TRANSITION } from './icon-transition.ts';
import { OPACITY } from './opacity.ts';
import { RIPPLE } from './ripple.ts';
import { SCALE as MICROINTERACTION_SCALE_IMPORT } from './scale.ts';
import { SEARCH } from './search.ts';
import { TOOLTIP } from './tooltip.ts';

export * from './button.ts';
export * from './icon-button.ts';
export * from './card.ts';
export * from './tooltip.ts';
export * from './icon-transition.ts';
export * from './ripple.ts';
export * from './color-transition.ts';
export { SCALE as MICROINTERACTION_SCALE } from './scale.ts';
export * from './opacity.ts';
export * from './hero.ts';
export * from './search.ts';

/**
 * Complete Microinteractions Design Tokens
 */
export const MICROINTERACTIONS = {
  button: BUTTON,
  card: CARD,
  colorTransition: COLOR_TRANSITION,
  hero: HERO,
  iconButton: ICON_BUTTON,
  iconTransition: ICON_TRANSITION,
  opacity: OPACITY,
  ripple: RIPPLE,
  scale: MICROINTERACTION_SCALE_IMPORT,
  search: SEARCH,
  tooltip: TOOLTIP,
} as const;

/**
 * Type helper for microinteractions tokens
 */
export type MicrointeractionsTokens = typeof MICROINTERACTIONS;
