/**
 * Design System Styles
 *
 * NOTE: Semantic utility wrappers (spacing, layout, typography, interactive, icons, borders, dimensions, position)
 * have been removed as part of the Direct Tailwind migration. All components now use Direct Tailwind classes.
 *
 * Remaining exports:
 * - gradients.ts: Custom CSS gradient class names (heroTexture only - complex Tailwind arbitrary value)
 *
 * REMOVED:
 * - animations.ts: Not used - components use Tailwind animate-* classes directly
 * - badges.ts: Not used - components use Tailwind badge classes directly
 */

export * from './gradients.ts';
