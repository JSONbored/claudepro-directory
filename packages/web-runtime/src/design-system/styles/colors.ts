/**
 * Semantic Color Utilities
 *
 * Composable patterns for text, background, and border colors.
 * Uses Tailwind's semantic color system for consistency.
 *
 * @module web-runtime/design-system/styles/colors
 */

// =============================================================================
// TEXT COLORS
// =============================================================================

/**
 * Semantic text color utilities.
 */
export const textColor = {
  // Base colors
  /** Primary foreground text */
  foreground: 'text-foreground',
  /** Primary brand color */
  primary: 'text-primary',
  /** Secondary/muted text */
  muted: 'text-muted-foreground',
  /** Accent color */
  accent: 'text-accent',
  /** Destructive/error color */
  destructive: 'text-destructive',

  // Semantic status colors
  /** Success green */
  success: 'text-green-600 dark:text-green-400',
  /** Warning amber */
  warning: 'text-amber-600 dark:text-amber-400',
  /** Error red */
  error: 'text-red-600 dark:text-red-400',
  /** Info blue */
  info: 'text-blue-600 dark:text-blue-400',

  // Inverted/special
  /** Primary foreground on primary background */
  primaryForeground: 'text-primary-foreground',
  /** Accent foreground on accent background */
  accentForeground: 'text-accent-foreground',
  /** White text */
  white: 'text-white',
  /** Black text */
  black: 'text-black',
  /** Transparent */
  transparent: 'text-transparent',

  // Direct color access
  green: 'text-green-600 dark:text-green-400',
  blue: 'text-blue-600 dark:text-blue-400',
  red: 'text-red-600 dark:text-red-400',
  amber: 'text-amber-600 dark:text-amber-400',
  yellow: 'text-yellow-600 dark:text-yellow-400',
  orange: 'text-orange-600 dark:text-orange-400',
  purple: 'text-purple-600 dark:text-purple-400',
  pink: 'text-pink-600 dark:text-pink-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
} as const;

// =============================================================================
// BACKGROUND COLORS
// =============================================================================

/**
 * Semantic background color utilities.
 * 
 * @migration Replaces inline `bg-*` Tailwind classes
 * @example
 * // ❌ OLD: className="bg-amber-500"
 * // ✅ NEW: className={bgColor.amber}
 * // ❌ OLD: className="bg-green-500/10"
 * // ✅ NEW: className={bgColor['green/10']}
 */
export const bgColor = {
  // Base semantic colors
  /** Primary background */
  background: 'bg-background',
  /** Card background */
  card: 'bg-card',
  /** Muted background */
  muted: 'bg-muted',
  /** Primary brand background */
  primary: 'bg-primary',
  /** Accent background */
  accent: 'bg-accent',
  /** Destructive background */
  destructive: 'bg-destructive',
  /** Transparent */
  transparent: 'bg-transparent',
  /** White */
  white: 'bg-white',
  /** Black */
  black: 'bg-black',

  // Solid semantic colors (500 shade - standard)
  /** Amber solid */
  amber: 'bg-amber-500',
  /** Blue solid */
  blue: 'bg-blue-500',
  /** Emerald solid */
  emerald: 'bg-emerald-500',
  /** Green solid */
  green: 'bg-green-500',
  /** Orange solid */
  orange: 'bg-orange-500',
  /** Purple solid */
  purple: 'bg-purple-500',
  /** Red solid */
  red: 'bg-red-500',
  /** Violet solid */
  violet: 'bg-violet-500',
  /** Yellow solid */
  yellow: 'bg-yellow-500',
  /** Pink solid */
  pink: 'bg-pink-500',
  
  // Solid semantic colors (600 shade - darker)
  /** Violet dark */
  violetDark: 'bg-violet-600',
  /** Amber dark */
  amberDark: 'bg-amber-600',
  
  // Light backgrounds (50 shade - for light mode callouts)
  /** Yellow light (warning callouts) */
  yellowLight: 'bg-yellow-50',
  /** Red light (error callouts) */
  redLight: 'bg-red-50',
  /** Green light (success callouts) */
  greenLight: 'bg-green-50',
  /** Blue light (info callouts) */
  blueLight: 'bg-blue-50',
  
  // Dark backgrounds (900/950 shade - for dark mode callouts)
  /** Yellow dark */
  yellowDark: 'bg-yellow-950',
  /** Red dark */
  redDark: 'bg-red-950',
  /** Green dark */
  greenDark: 'bg-green-950',
  /** Blue dark */
  blueDark: 'bg-blue-950',
  /** Yellow medium dark (100) */
  yellowMedium: 'bg-yellow-100',
  /** Yellow extra dark (900) */
  yellowExtraDark: 'bg-yellow-900',
  /** Red medium (100) */
  redMedium: 'bg-red-100',
  /** Red extra dark (900) */
  redExtraDark: 'bg-red-900',
  /** Blue medium (100) */
  blueMedium: 'bg-blue-100',
  /** Blue extra dark (900) */
  blueExtraDark: 'bg-blue-900',

  // Semantic status backgrounds (with opacity)
  /** Success background */
  success: 'bg-green-500/10',
  /** Warning background */
  warning: 'bg-amber-500/10',
  /** Error background */
  error: 'bg-red-500/10',
  /** Info background */
  info: 'bg-blue-500/10',

  // Opacity variants for green
  'green/10': 'bg-green-500/10',
  'green/20': 'bg-green-500/20',

  // Opacity variants for purple
  'purple/10': 'bg-purple-500/10',
  'purple/20': 'bg-purple-500/20',

  // Opacity variants for primary
  'primary/5': 'bg-primary/5',
  'primary/10': 'bg-primary/10',
  'primary/20': 'bg-primary/20',
  'primary/30': 'bg-primary/30',
  'primary/50': 'bg-primary/50',

  // Opacity variants for accent
  'accent/5': 'bg-accent/5',
  'accent/10': 'bg-accent/10',
  'accent/20': 'bg-accent/20',
  'accent/30': 'bg-accent/30',
  'accent/50': 'bg-accent/50',

  // Opacity variants for muted
  'muted/10': 'bg-muted/10',
  'muted/20': 'bg-muted/20',
  'muted/30': 'bg-muted/30',
  'muted/40': 'bg-muted/40',
  'muted/50': 'bg-muted/50',
  'muted/60': 'bg-muted/60',

  // Opacity variants for card
  'card/50': 'bg-card/50',
  'card/60': 'bg-card/60',
  'card/70': 'bg-card/70',
  'card/80': 'bg-card/80',

  // Opacity variants for background
  'background/80': 'bg-background/80',
  'background/90': 'bg-background/90',
  'background/95': 'bg-background/95',

  // Opacity variants for destructive
  'destructive/10': 'bg-destructive/10',
  'destructive/20': 'bg-destructive/20',
  
  // Opacity variants for white (glass effects)
  'white/5': 'bg-white/5',
  'white/10': 'bg-white/10',
  'white/20': 'bg-white/20',
  
  // Opacity variants for black (overlays)
  'black/40': 'bg-black/40',
  'black/50': 'bg-black/50',
  'black/60': 'bg-black/60',
  'black/70': 'bg-black/70',
  'black/80': 'bg-black/80',

  // Overlay backgrounds
  /** Modal overlay background */
  overlay: 'bg-black/60',
} as const;

// =============================================================================
// BORDER COLORS
// =============================================================================

/**
 * Semantic border color utilities.
 */
export const borderColor = {
  // Base colors
  /** Default border */
  border: 'border-border',
  /** Primary border */
  primary: 'border-primary',
  /** Accent border */
  accent: 'border-accent',
  /** Input border */
  input: 'border-input',
  /** Destructive border */
  destructive: 'border-destructive',
  /** Transparent border */
  transparent: 'border-transparent',

  // Opacity variants for border
  'border/30': 'border-border/30',
  'border/40': 'border-border/40',
  'border/50': 'border-border/50',
  'border/60': 'border-border/60',

  // Opacity variants for primary
  'primary/20': 'border-primary/20',
  'primary/30': 'border-primary/30',
  'primary/50': 'border-primary/50',

  // Opacity variants for accent
  'accent/20': 'border-accent/20',
  'accent/30': 'border-accent/30',
  'accent/40': 'border-accent/40',
  'accent/50': 'border-accent/50',

  // Status colors
  /** Success border */
  success: 'border-green-500',
  /** Warning border */
  warning: 'border-amber-500',
  /** Error border */
  error: 'border-red-500',
  /** Info border */
  info: 'border-blue-500',

  // Direct color access with opacity
  green: 'border-green-500',
  'green/30': 'border-green-500/30',
  blue: 'border-blue-500',
  'blue/30': 'border-blue-500/30',
  amber: 'border-amber-500',
  'amber/30': 'border-amber-500/30',
} as const;

// =============================================================================
// TEXT ALIGNMENT
// =============================================================================

/**
 * Text alignment utilities.
 */
export const textAlign = {
  /** Left aligned */
  left: 'text-left',
  /** Center aligned */
  center: 'text-center',
  /** Right aligned */
  right: 'text-right',
  /** Justified */
  justify: 'text-justify',
  /** Start (respects RTL) */
  start: 'text-start',
  /** End (respects RTL) */
  end: 'text-end',
} as const;

// =============================================================================
// GRADIENTS
// =============================================================================

/**
 * Gradient direction utilities.
 * 
 * @migration Replaces inline `bg-gradient-to-*` Tailwind classes
 * @example
 * // ❌ OLD: className="bg-gradient-to-br"
 * // ✅ NEW: className={bgGradient.toBR}
 */
export const bgGradient = {
  /** Linear to right */
  toR: 'bg-gradient-to-r',
  /** Linear to left */
  toL: 'bg-gradient-to-l',
  /** Linear to top */
  toT: 'bg-gradient-to-t',
  /** Linear to bottom */
  toB: 'bg-gradient-to-b',
  /** Linear to top-right */
  toTR: 'bg-gradient-to-tr',
  /** Linear to top-left */
  toTL: 'bg-gradient-to-tl',
  /** Linear to bottom-right */
  toBR: 'bg-gradient-to-br',
  /** Linear to bottom-left */
  toBL: 'bg-gradient-to-bl',
  /** Radial gradient */
  radial: 'bg-radial',
} as const;

/**
 * Gradient from (start) color stops.
 * 
 * @migration Replaces inline `from-*` Tailwind classes
 * @example
 * // ❌ OLD: className="from-accent/20"
 * // ✅ NEW: className={gradientFrom.accent20}
 */
export const gradientFrom = {
  // Base semantic colors
  /** From background */
  background: 'from-background',
  /** From transparent */
  transparent: 'from-transparent',
  /** From card */
  card: 'from-card',
  /** From muted */
  muted: 'from-muted',
  /** From primary */
  primary: 'from-primary',
  /** From accent */
  accent: 'from-accent',
  /** From foreground */
  foreground: 'from-foreground',
  /** From muted-foreground */
  mutedForeground: 'from-muted-foreground',
  /** From white */
  white: 'from-white',
  /** From black */
  black: 'from-black',
  
  // Opacity variants for accent
  /** From accent/5 */
  accent5: 'from-accent/5',
  /** From accent/10 */
  accent10: 'from-accent/10',
  /** From accent/20 */
  accent20: 'from-accent/20',
  /** From accent/30 */
  accent30: 'from-accent/30',
  
  // Opacity variants for primary
  /** From primary/5 */
  primary5: 'from-primary/5',
  /** From primary/10 */
  primary10: 'from-primary/10',
  /** From primary/20 */
  primary20: 'from-primary/20',
  
  // Opacity variants for muted
  /** From muted/10 */
  muted10: 'from-muted/10',
  /** From muted/20 */
  muted20: 'from-muted/20',
  /** From muted/50 */
  muted50: 'from-muted/50',
  
  // Opacity variants for white (glass effects)
  /** From white/5 */
  white5: 'from-white/5',
  /** From white/10 */
  white10: 'from-white/10',
} as const;

/**
 * Gradient via (middle) color stops.
 * 
 * @migration Replaces inline `via-*` Tailwind classes
 * @example
 * // ❌ OLD: className="via-transparent"
 * // ✅ NEW: className={gradientVia.transparent}
 */
export const gradientVia = {
  /** Via background */
  background: 'via-background',
  /** Via transparent */
  transparent: 'via-transparent',
  /** Via muted */
  muted: 'via-muted',
  /** Via card */
  card: 'via-card',
  /** Via primary */
  primary: 'via-primary',
  /** Via accent */
  accent: 'via-accent',
  /** Via foreground */
  foreground: 'via-foreground',
  /** Via muted-foreground */
  mutedForeground: 'via-muted-foreground',
  /** Via white */
  white: 'via-white',
  /** Via black */
  black: 'via-black',
} as const;

/**
 * Gradient to (end) color stops.
 * 
 * @migration Replaces inline `to-*` Tailwind classes
 * @example
 * // ❌ OLD: className="to-muted/10"
 * // ✅ NEW: className={gradientTo.muted10}
 */
export const gradientTo = {
  // Base semantic colors
  /** To background */
  background: 'to-background',
  /** To transparent */
  transparent: 'to-transparent',
  /** To card */
  card: 'to-card',
  /** To muted */
  muted: 'to-muted',
  /** To primary */
  primary: 'to-primary',
  /** To accent */
  accent: 'to-accent',
  /** To foreground */
  foreground: 'to-foreground',
  /** To muted-foreground */
  mutedForeground: 'to-muted-foreground',
  /** To white */
  white: 'to-white',
  /** To black */
  black: 'to-black',
  
  // Opacity variants for muted
  /** To muted/10 */
  muted10: 'to-muted/10',
  /** To muted/20 */
  muted20: 'to-muted/20',
  /** To muted/50 */
  muted50: 'to-muted/50',
  
  // Opacity variants for primary
  /** To primary/5 */
  primary5: 'to-primary/5',
  /** To primary/10 */
  primary10: 'to-primary/10',
  /** To primary/20 */
  primary20: 'to-primary/20',
  
  // Opacity variants for accent
  /** To accent/5 */
  accent5: 'to-accent/5',
  /** To accent/10 */
  accent10: 'to-accent/10',
  /** To accent/20 */
  accent20: 'to-accent/20',
  
  // Opacity variants for white (glass effects)
  /** To white/5 */
  white5: 'to-white/5',
  /** To white/10 */
  white10: 'to-white/10',
} as const;
