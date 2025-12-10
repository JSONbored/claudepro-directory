/**
 * State Design Tokens
 *
 * Comprehensive state system for loading, error, success, warning, info, and disabled states.
 * Provides tokens for all UI states with theme-aware colors.
 *
 * Architecture:
 * - Loading states (skeleton, spinner, progress)
 * - Error states (text, background, border, icon)
 * - Success states (text, background, border, icon)
 * - Warning states (text, background, border, icon)
 * - Info states (text, background, border, icon)
 * - Disabled states (appearance, cursor, interaction)
 *
 * Usage:
 * ```tsx
 * import { STATES } from '@heyclaude/web-runtime/design-tokens';
 *
 * // Loading state
 * <div style={STATES.loading.skeleton}>
 *
 * // Error state
 * <div style={{ color: STATES.error.text.dark }}>
 *
 * // Disabled state
 * <button disabled style={{ opacity: STATES.disabled.appearance.opacity }}>
 * ```
 *
 * @module web-runtime/design-tokens/states
 */

export * from './loading.ts';
export * from './error.ts';
export * from './success.ts';
export * from './warning.ts';
export * from './info.ts';
export * from './disabled.ts';

import { LOADING_STATES } from './loading.ts';
import { ERROR_STATES } from './error.ts';
import { SUCCESS_STATES } from './success.ts';
import { WARNING_STATES } from './warning.ts';
import { INFO_STATES } from './info.ts';
import { DISABLED_STATES } from './disabled.ts';

/**
 * Complete State Design Tokens
 * Organized by state type (loading, error, success, warning, info, disabled)
 */
export const STATES = {
  loading: LOADING_STATES,
  error: ERROR_STATES,
  success: SUCCESS_STATES,
  warning: WARNING_STATES,
  info: INFO_STATES,
  disabled: DISABLED_STATES,
} as const;
