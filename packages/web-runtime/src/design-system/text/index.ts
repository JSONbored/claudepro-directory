/**
 * Text Animation Variants
 *
 * Preset configurations for text animations (blur, fade, slide, etc.).
 * Used with text animation components like BlurText, GradientText, etc.
 *
 * Architecture:
 * - Self-contained semantic values (v2 design system)
 * - Organized by animation type
 * - Optimized for readability and performance
 *
 * Usage:
 * ```tsx
 * import { TEXT_ANIMATIONS } from '@heyclaude/web-runtime/design-system';
 *
 * <BlurText
 *   text="Hello World"
 *   animationFrom={TEXT_ANIMATIONS.blur.from}
 *   animationTo={TEXT_ANIMATIONS.blur.to}
 * />
 * ```
 *
 * @module web-runtime/design-system/text
 */

// Re-export all as TEXT_ANIMATIONS for convenience
import { BLUR } from './blur.ts';
import { FADE } from './fade.ts';
import { SCALE as TEXT_SCALE_IMPORT } from './scale.ts';
import { SLIDE } from './slide.ts';

export * from './blur.ts';
export * from './fade.ts';
export * from './slide.ts';
export { SCALE as TEXT_SCALE } from './scale.ts';

/**
 * Complete Text Animation Design Tokens
 */
export const TEXT_ANIMATIONS = {
  blur: BLUR,
  fade: FADE,
  scale: TEXT_SCALE_IMPORT,
  slide: SLIDE,
} as const;
