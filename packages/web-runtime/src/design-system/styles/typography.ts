/**
 * Typography Style Utilities
 *
 * Composable patterns for text styling.
 * Replaces UI_CLASSES typography patterns.
 *
 * @module web-runtime/design-system/styles/typography
 */

// =============================================================================
// HEADING STYLES
// =============================================================================

/**
 * Heading styles for semantic hierarchy.
 */
export const heading = {
  /** Hero headline - 4xl/6xl bold */
  hero: 'text-4xl lg:text-6xl font-bold mb-6 text-foreground',
  /** Page title - 3xl/4xl bold */
  page: 'text-3xl md:text-4xl font-bold tracking-tight',
  /** Section title - 2xl semibold */
  section: 'text-2xl font-semibold mb-4',
  /** Subsection - xl semibold */
  subsection: 'text-xl font-semibold mb-3',
  /** Card title - lg semibold */
  card: 'text-lg font-semibold',
  /** Small heading */
  small: 'text-base font-semibold',

  // Semantic HTML equivalents
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-3xl font-semibold tracking-tight',
  h3: 'text-2xl font-semibold',
  h4: 'text-xl font-semibold',
  h5: 'text-lg font-semibold',
  h6: 'text-base font-semibold',
} as const;

// =============================================================================
// BODY TEXT STYLES
// =============================================================================

/**
 * Body text styles.
 */
export const body = {
  /** Large body text */
  lg: 'text-lg leading-relaxed',
  /** Default body text */
  default: 'text-base leading-normal',
  /** Small body text */
  sm: 'text-sm leading-normal',
  /** Extra small body text */
  xs: 'text-xs leading-normal',
} as const;

/**
 * Muted text styles (secondary color).
 */
export const muted = {
  /** Default muted */
  default: 'text-muted-foreground',
  /** Small muted */
  sm: 'text-sm text-muted-foreground',
  /** Small muted with relaxed line height (for descriptions) */
  smRelaxed: 'text-sm text-muted-foreground leading-relaxed',
  /** Extra small muted */
  xs: 'text-xs text-muted-foreground',
  /** Large muted */
  lg: 'text-lg text-muted-foreground leading-relaxed',
} as const;

// =============================================================================
// LABEL & HELPER TEXT
// =============================================================================

/**
 * Label styles for form fields and UI elements.
 */
export const label = {
  /** Standard label */
  default: 'text-sm font-medium text-foreground',
  /** Small label */
  sm: 'text-sm font-medium',
  /** Small semibold label */
  semibold: 'text-sm font-semibold',
  /** Small semibold foreground (for section headers) */
  sectionHeader: 'text-sm font-semibold text-foreground',
  /** Required label (use with ::after for asterisk) */
  required: 'text-sm font-medium text-foreground after:content-["*"] after:ml-0.5 after:text-error',
} as const;

/**
 * Helper/caption text styles.
 */
export const helper = {
  /** Default helper text */
  default: 'text-xs text-muted-foreground',
  /** Error message (red-500) */
  error: 'text-sm text-red-500',
  /** Destructive error (uses theme destructive token) */
  destructive: 'text-sm text-destructive',
  /** Success message */
  success: 'text-sm text-green-500',
  /** Warning message */
  warning: 'text-sm text-yellow-500',
} as const;

// =============================================================================
// SPECIALIZED TEXT
// =============================================================================

/**
 * Badge text styles.
 */
export const badge = {
  /** Default badge text */
  default: 'text-xs font-semibold',
  /** Small badge/pill text */
  sm: 'text-[10px] font-semibold uppercase tracking-wider',
} as const;

/**
 * Metadata/stat text styles.
 */
export const stat = {
  /** Large stat value */
  value: 'font-bold text-2xl',
  /** Extra large stat */
  large: 'font-bold text-3xl',
  /** Stat label */
  label: 'text-xs text-muted-foreground mt-1',
} as const;

/**
 * Price display styles.
 */
export const price = {
  /** Primary price */
  primary: 'font-bold text-3xl',
  /** Strikethrough price */
  strikethrough: 'font-bold text-xl line-through text-muted-foreground',
} as const;

/**
 * Navigation text styles.
 */
export const nav = {
  /** Default nav text */
  default: 'text-foreground/80 hover:text-foreground',
  /** Active nav item */
  active: 'text-primary',
} as const;

// =============================================================================
// TEXT UTILITIES
// =============================================================================

/**
 * Font weight utilities.
 */
export const weight = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const;

/**
 * Text size utilities.
 */
export const size = {
  '2xs': 'text-2xs',
  '3xs': 'text-3xs',
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
  '7xl': 'text-7xl',
  '8xl': 'text-8xl',
  '9xl': 'text-9xl',
} as const;

/**
 * Line height utilities.
 */
export const leading = {
  none: 'leading-none',
  tight: 'leading-tight',
  snug: 'leading-snug',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose',
} as const;

/**
 * Letter spacing utilities.
 */
export const tracking = {
  tighter: 'tracking-tighter',
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
  wider: 'tracking-wider',
  widest: 'tracking-widest',
} as const;

/**
 * Text truncation utilities.
 */
export const truncate = {
  /** Single line truncation */
  single: 'truncate',
  /** 2-line clamp */
  lines2: 'line-clamp-2',
  /** 3-line clamp */
  lines3: 'line-clamp-3',
  /** 4-line clamp */
  lines4: 'line-clamp-4',
} as const;

/**
 * Whitespace utilities.
 */
export const whitespace = {
  /** Normal whitespace handling */
  normal: 'whitespace-normal',
  /** Prevent wrapping */
  nowrap: 'whitespace-nowrap',
  /** Preserve whitespace and newlines */
  pre: 'whitespace-pre',
  /** Preserve whitespace but wrap lines */
  preLine: 'whitespace-pre-line',
  /** Preserve all whitespace and wrap */
  preWrap: 'whitespace-pre-wrap',
  /** Break words at any character */
  breakAll: 'break-all',
  /** Break only at word boundaries */
  breakWords: 'break-words',
  /** Don't break words */
  breakNormal: 'break-normal',
} as const;

// =============================================================================
// RESPONSIVE TEXT
// =============================================================================

/**
 * Responsive text size patterns.
 */
export const responsiveText = {
  // V1 compatible aliases (sm, md, lg, xl, 2xl)
  /** text-sm sm:text-sm md:text-base - Small responsive */
  sm: 'text-sm sm:text-sm md:text-base',
  /** text-base sm:text-base md:text-lg - Medium responsive */
  md: 'text-base sm:text-base md:text-lg',
  /** text-lg sm:text-lg md:text-xl lg:text-2xl - Large responsive */
  lg: 'text-lg sm:text-lg md:text-xl lg:text-2xl',
  /** text-xl sm:text-xl md:text-2xl lg:text-3xl - Extra large responsive */
  xl: 'text-xl sm:text-xl md:text-2xl lg:text-3xl',
  /** text-2xl sm:text-2xl md:text-3xl lg:text-4xl - 2XL responsive */
  '2xl': 'text-2xl sm:text-2xl md:text-3xl lg:text-4xl',
  
  // Semantic aliases (for backward compatibility)
  /** sm → base (alias for .sm) */
  smBase: 'text-sm sm:text-sm md:text-base',
  /** base → lg (alias for .md) */
  baseLg: 'text-base sm:text-base md:text-lg',
  /** lg → xl → 2xl (alias for .lg) */
  lgXl: 'text-lg sm:text-lg md:text-xl lg:text-2xl',
  /** xl → 2xl → 3xl (alias for .xl) */
  xl2xl: 'text-xl sm:text-xl md:text-2xl lg:text-3xl',
  /** 2xl → 3xl → 4xl (alias for .2xl) */
  xl3xl: 'text-2xl sm:text-2xl md:text-3xl lg:text-4xl',
} as const;
