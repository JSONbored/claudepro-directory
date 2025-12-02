/**
 * Icon Style Utilities
 *
 * Composable patterns for icon sizing and styling.
 * Replaces UI_CLASSES icon patterns.
 *
 * @module web-runtime/design-system/styles/icons
 */

// =============================================================================
// ICON SIZES
// =============================================================================

/**
 * Icon size classes.
 */
/**
 * Icon size classes for semantic icon sizing.
 * 
 * @migration Replaces inline `h-X w-X` patterns for icons
 * @example
 * // ❌ OLD: className="h-4 w-4"
 * // ✅ NEW: className={iconSize.sm}
 * 
 * @see {@link iconLeading} - For icons with margin-right
 * @see {@link iconTrailing} - For icons with margin-left
 */
/**
 * Icon size classes for semantic icon sizing.
 * 
 * @migration Replaces inline `h-X w-X` patterns for icons
 * @example
 * // ❌ OLD: className="h-4 w-4"
 * // ✅ NEW: className={iconSize.sm}
 * // ❌ OLD: className="h-6 w-6"
 * // ✅ NEW: className={iconSize.lg}
 * 
 * @see {@link iconLeading} - For icons with margin-right
 * @see {@link iconTrailing} - For icons with margin-left
 */
export const iconSize = {
  /** h-2 w-2 - 8px - Indicator dot */
  indicator: 'h-2 w-2',
  /** h-2.5 w-2.5 - 10px - Extra extra small (dropdown chevrons) */
  xxs: 'h-2.5 w-2.5',
  /** h-3 w-3 - 12px - Extra small */
  xs: 'h-3 w-3',
  /** h-3.5 w-3.5 - 14px - Between xs and sm */
  xsPlus: 'h-3.5 w-3.5',
  /** h-4 w-4 - 16px - Small (default for inline icons) */
  sm: 'h-4 w-4',
  /** h-5 w-5 - 20px - Medium */
  md: 'h-5 w-5',
  /** h-6 w-6 - 24px - Large */
  lg: 'h-6 w-6',
  /** h-7 w-7 - 28px - Large plus (OAuth buttons) */
  lgPlus: 'h-7 w-7',
  /** h-8 w-8 - 32px - Extra large */
  xl: 'h-8 w-8',
  /** h-10 w-10 - 40px - 2XL (hero decorative icons) */
  '2xl': 'h-10 w-10',
  /** h-12 w-12 - 48px - 3XL (hero decorative icons) */
  '3xl': 'h-12 w-12',
  /** h-16 w-16 - 64px - 4XL (large hero/empty state icons) */
  '4xl': 'h-16 w-16',
  /** h-20 w-20 - 80px - 5XL (extra large decorative) */
  '5xl': 'h-20 w-20',
  /** h-24 w-24 - 96px - 6XL (hero section decorative) */
  '6xl': 'h-24 w-24',
  /** h-32 w-32 - 128px - Hero (massive decorative icons) */
  hero: 'h-32 w-32',
} as const;

// =============================================================================
// ICON WITH MARGIN (for text alignment)
// =============================================================================

/**
 * Icons with leading margin (for label icons).
 */
export const iconLeading = {
  xs: 'h-3 w-3 mr-1',
  sm: 'h-4 w-4 mr-2',
  md: 'h-5 w-5 mr-2',
} as const;

/**
 * Icons with trailing margin.
 */
export const iconTrailing = {
  xs: 'h-3 w-3 ml-1',
  sm: 'h-4 w-4 ml-2',
  md: 'h-5 w-5 ml-2',
} as const;

// =============================================================================
// ICON SEMANTIC COLORS
// =============================================================================

/**
 * Semantic icon colors.
 */
export const iconColor = {
  success: 'text-green-500 dark:text-green-400',
  warning: 'text-yellow-500 dark:text-yellow-400',
  error: 'text-red-500 dark:text-red-400',
  info: 'text-blue-500 dark:text-blue-400',
  neutral: 'text-gray-500 dark:text-gray-400',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  accent: 'text-accent',
} as const;

// =============================================================================
// ICON BUTTON SIZES
// =============================================================================

/**
 * Icon button dimensions (for button containing only icon).
 * Note: Named `iconButtonSize` to avoid collision with `iconButton` in buttons.ts.
 */
export const iconButtonSize = {
  sm: 'h-7 w-7 p-0',
  md: 'h-9 w-9 p-0',
  lg: 'h-10 w-10 p-0',
} as const;

/**
 * Icon button min dimensions.
 */
export const iconButtonMin = {
  sm: 'min-w-[36px] min-h-[36px]',
  md: 'min-w-[40px] min-h-[40px]',
} as const;

// =============================================================================
// ICON WRAPPERS (circular backgrounds)
// =============================================================================

/**
 * Icon wrapper styles (circular container for icons).
 */
export const iconWrapper = {
  /** Small rounded-md wrapper */
  sm: 'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md',
  /** Medium circular wrapper */
  md: 'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
  /** Large circular wrapper */
  lg: 'flex h-10 w-10 items-center justify-center rounded-full',
  /** Extra large wrapper */
  xl: 'flex h-12 w-12 items-center justify-center rounded-full',
} as const;

/**
 * Social icon wrapper (small circle).
 */
export const socialIconWrapper = 'flex h-5 w-5 items-center justify-center rounded-full';

// =============================================================================
// ICON INDICATORS
// =============================================================================

/**
 * Success indicator icon.
 */
export const successIndicator = 'h-4 w-4 text-green-500 mt-0.5';

/**
 * Primary colored large icon.
 */
export const iconPrimary = 'h-5 w-5 text-primary';
