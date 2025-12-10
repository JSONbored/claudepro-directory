/**
 * Design Tokens V2 - TypeScript Types
 *
 * Type definitions for design tokens.
 * Ensures type safety across all token systems.
 *
 * @module web-runtime/design-tokens/types
 */

/**
 * Color value type (OKLCH, RGB, or hex)
 */
export type ColorValue = string;

/**
 * Spacing value type (number in pixels or rem)
 */
export type SpacingValue = number | string;

/**
 * Font size value type
 */
export type FontSizeValue = string | number;

/**
 * Font weight value type
 */
export type FontWeightValue = number | string;

/**
 * Line height value type
 */
export type LineHeightValue = number | string;

/**
 * Letter spacing value type
 */
export type LetterSpacingValue = string;

/**
 * Shadow value type
 */
export type ShadowValue = string;

/**
 * Breakpoint value type
 */
export type BreakpointValue = string | number;

/**
 * Theme mode type
 */
export type ThemeMode = 'light' | 'dark' | 'high-contrast';

/**
 * State type
 */
export type StateType = 'loading' | 'error' | 'success' | 'warning' | 'info' | 'disabled';

/**
 * Elevation level type
 */
export type ElevationLevel = 'subtle' | 'default' | 'strong' | 'stronger' | 'strongest';

/**
 * Spacing scale type
 */
export type SpacingScale = 'micro' | 'tight' | 'compact' | 'default' | 'comfortable' | 'relaxed' | 'loose' | 'section' | 'hero';

/**
 * Typography scale type
 */
export type TypographyScale = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

/**
 * Font weight scale type
 */
export type FontWeightScale = 'light' | 'normal' | 'medium' | 'semibold' | 'bold';

/**
 * Line height scale type
 */
export type LineHeightScale = 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';

/**
 * Letter spacing scale type
 */
export type LetterSpacingScale = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';
