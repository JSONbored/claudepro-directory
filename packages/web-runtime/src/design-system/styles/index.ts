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

export * from './layout.js';
export * from './spacing.js';
export * from './typography.js';
export * from './interactive.js';
export * from './icons.js';
export * from './borders.js';
