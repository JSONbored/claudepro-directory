/**
 * Accessibility Design Tokens
 *
 * Accessibility system for focus indicators, contrast ratios, and reduced motion.
 * Ensures WCAG AA compliance and supports WCAG 3.0 APCA.
 *
 * Architecture:
 * - Focus states (ring, visible, active)
 * - Contrast ratios (WCAG AA/AAA, APCA)
 * - Reduced motion (respects user preferences)
 *
 * Usage:
 * ```tsx
 * import { ACCESSIBILITY } from '@heyclaude/web-runtime/design-tokens';
 *
 * // Focus ring
 * <button style={{ outline: ACCESSIBILITY.focus.visible.outline }}>
 *
 * // Reduced motion
 * @media ${ACCESSIBILITY.motion.reduced.mediaQuery} {
 *   animation: ${ACCESSIBILITY.motion.reduced.animation};
 * }
 * ```
 *
 * @module web-runtime/design-tokens/accessibility
 */

export * from './focus.ts';
export * from './contrast.ts';
export * from './motion.ts';

import { FOCUS_STATES } from './focus.ts';
import { CONTRAST_RATIOS } from './contrast.ts';
import { REDUCED_MOTION } from './motion.ts';

/**
 * Complete Accessibility Design Tokens
 * Organized by category (focus, contrast, motion)
 */
export const ACCESSIBILITY = {
  focus: FOCUS_STATES,
  contrast: CONTRAST_RATIOS,
  motion: {
    reduced: REDUCED_MOTION,
  },
} as const;
