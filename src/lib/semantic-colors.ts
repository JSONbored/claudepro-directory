/**
 * Semantic Color System
 *
 * Centralized color constants for consistent theming across the application.
 * All colors support dark mode automatically via Tailwind's color system.
 *
 * Architecture:
 * - Uses Tailwind v4 color classes (text-*, border-*, bg-*)
 * - Standardized opacity scale (5, 10, 20, 30, 50, 80)
 * - Semantic naming (SUCCESS, WARNING, ERROR, INFO instead of color names)
 * - Three intensity levels per state: SUBTLE (5-20%), DEFAULT (10-50%), BOLD (20-50%)
 *
 * Usage:
 * ```tsx
 * import { SEMANTIC_COLORS } from '@/src/lib/semantic-colors';
 *
 * <div className={SEMANTIC_COLORS.SUCCESS}>Success state</div>
 * <div className={SEMANTIC_COLORS.WARNING_SUBTLE}>Subtle warning</div>
 * <div className={SEMANTIC_COLORS.FEATURED}>Featured badge</div>
 * ```
 *
 * Color Palette:
 * - Success: Green (positive actions, confirmations, success states)
 * - Warning: Yellow (caution, pending states, attention needed)
 * - Error: Red (errors, destructive actions, critical alerts)
 * - Info: Blue (informational, neutral highlights)
 * - Featured: Amber→Yellow gradient (premium content, featured items)
 * - Sponsored: Purple→Pink gradient (sponsored content, promotions)
 *
 * Opacity Scale:
 * - /5  - SUBTLE backgrounds (very faint)
 * - /10 - DEFAULT backgrounds (standard badge/card)
 * - /20 - MEDIUM borders and accents
 * - /30 - STRONG borders (prominent elements)
 * - /50 - BOLD borders (active/focused states)
 * - /80 - HOVER overlays (interactive feedback)
 */

/**
 * State Colors - Success, Warning, Error, Info
 *
 * Three intensity levels for each state:
 * - SUBTLE: Very subtle background, faint border (5-20% opacity)
 * - DEFAULT: Standard badge/card style (10-50% opacity)
 * - BOLD: Prominent, high-contrast (20-50% opacity)
 */
export const SEMANTIC_COLORS = {
  // Success states (green) - positive actions, confirmations, completion
  SUCCESS: 'text-green-400 border-green-500/50 bg-green-500/10',
  SUCCESS_SUBTLE: 'text-green-400 border-green-500/20 bg-green-500/5',
  SUCCESS_BOLD: 'text-green-400 border-green-500 bg-green-500/20',

  // Warning states (yellow) - caution, pending, attention needed
  WARNING: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10',
  WARNING_SUBTLE: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
  WARNING_BOLD: 'text-yellow-400 border-yellow-500 bg-yellow-500/20',

  // Error states (red) - errors, destructive actions, critical alerts
  ERROR: 'text-red-400 border-red-500/50 bg-red-500/10',
  ERROR_SUBTLE: 'text-red-400 border-red-500/20 bg-red-500/5',
  ERROR_BOLD: 'text-red-400 border-red-500 bg-red-500/20',

  // Info states (blue) - informational, neutral highlights
  INFO: 'text-blue-400 border-blue-500/50 bg-blue-500/10',
  INFO_SUBTLE: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
  INFO_BOLD: 'text-blue-400 border-blue-500 bg-blue-500/20',

  // Feature/promotion colors (gradients for premium content)
  FEATURED:
    'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-yellow-500/10',
  SPONSORED:
    'text-purple-600 dark:text-purple-400 border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10',

  // Social proof colors (for notification badges, interaction counters)
  SOCIAL_VIEW: 'text-blue-500', // View counts
  SOCIAL_COPY: 'text-green-500', // Copy/usage counts
  SOCIAL_BOOKMARK: 'text-amber-500', // Bookmark counts

  // Swipe gesture feedback colors (mobile interactions)
  SWIPE_COPY: 'text-green-600 dark:text-green-400 border-green-500/30 bg-green-500/20',
  SWIPE_BOOKMARK: 'text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/20',
} as const;

/**
 * Opacity Scale
 *
 * Standardized opacity values for consistent transparency across components.
 * Use these constants when building custom color combinations.
 *
 * Example:
 * ```tsx
 * `bg-accent/${OPACITY_SCALE.LIGHT}` // bg-accent/10
 * `border-primary/${OPACITY_SCALE.STRONG}` // border-primary/30
 * ```
 */
export const OPACITY_SCALE = {
  /** Very subtle backgrounds (5%) */
  SUBTLE: '5',
  /** Standard badge/card backgrounds (10%) */
  LIGHT: '10',
  /** Border accents, medium backgrounds (20%) */
  MEDIUM: '20',
  /** Prominent borders, strong accents (30%) */
  STRONG: '30',
  /** Active states, focused elements (50%) */
  BOLD: '50',
  /** Hover overlays, interactive feedback (80%) */
  HOVER: '80',
} as const;

/**
 * InfoBox/Alert Variant Colors
 *
 * Specific to InfoBox and Alert components.
 * Uses left border + subtle background pattern.
 */
export const INFOBOX_COLORS = {
  INFO: 'border-blue-500 bg-blue-500/5',
  WARNING: 'border-yellow-500 bg-yellow-500/5',
  SUCCESS: 'border-green-500 bg-green-500/5',
  ERROR: 'border-red-500 bg-red-500/5',
} as const;

/**
 * InfoBox/Alert Icon Colors
 *
 * Icon colors for InfoBox and Alert components.
 * Matches the variant color but with solid color (no opacity).
 */
export const INFOBOX_ICON_COLORS = {
  INFO: 'text-blue-500',
  WARNING: 'text-yellow-500',
  SUCCESS: 'text-green-500',
  ERROR: 'text-red-500',
} as const;

/**
 * Type Exports
 *
 * For TypeScript consumers who need type-safe color keys.
 */
export type SemanticColorKey = keyof typeof SEMANTIC_COLORS;
export type OpacityScaleKey = keyof typeof OPACITY_SCALE;
export type InfoBoxColorKey = keyof typeof INFOBOX_COLORS;
export type InfoBoxIconColorKey = keyof typeof INFOBOX_ICON_COLORS;
