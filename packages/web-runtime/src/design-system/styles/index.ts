/**
 * Design System Styles
 * Semantic Tailwind utilities for consistent UI patterns
 * 
 * This module provides semantic utility objects that map to Tailwind classes.
 * Use these instead of inline Tailwind classes for better maintainability.
 * 
 * @example
 * ```tsx
 * import { stack, marginBottom, muted, iconSize, radius } from '@heyclaude/web-runtime/design-system';
 * 
 * <div className={`${stack.comfortable} ${marginBottom.default}`}>
 *   <p className={muted.default}>Text</p>
 *   <Icon className={iconSize.sm} />
 *   <button className={radius.lg}>Click</button>
 * </div>
 * ```
 */

export * from './layout.ts';
export * from './spacing.ts';
export * from './typography.ts';
export * from './interactive.ts';
export * from './icons.ts';
export * from './borders.ts';
export * from './animations.ts';
// colors.ts and shadows.ts deleted - use direct Tailwind utilities from @theme
export * from './badges.ts';
export * from './gradients.ts';
// shadows.ts deleted - use direct Tailwind utilities from @theme
export * from './dimensions.ts';
