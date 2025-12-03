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
  /** Primary foreground text with 80% opacity */
  foreground80: 'text-foreground/80',
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
  /** Success green (400 shade) */
  success400: 'text-green-400',
  /** Warning amber */
  warning: 'text-amber-600 dark:text-amber-400',
  /** Warning yellow (400 shade) */
  warning400: 'text-yellow-400',
  /** Error red */
  error: 'text-red-600 dark:text-red-400',
  /** Error red (400 shade) */
  error400: 'text-red-400',
  /** Info blue */
  info: 'text-blue-600 dark:text-blue-400',
  /** Info blue (400 shade) */
  info400: 'text-blue-400',
  /** Info blue (500 shade) */
  info500: 'text-blue-500 dark:text-blue-400',

  // Inverted/special
  /** Primary foreground on primary background */
  primaryForeground: 'text-primary-foreground',
  /** Accent foreground on accent background */
  accentForeground: 'text-accent-foreground',
  /** Secondary foreground on secondary background */
  secondaryForeground: 'text-secondary-foreground',
  /** Destructive foreground on destructive background */
  destructiveForeground: 'text-destructive-foreground',
  /** Card foreground on card background */
  cardForeground: 'text-card-foreground',
  /** Popover foreground on popover background */
  popoverForeground: 'text-popover-foreground',
  /** White text */
  white: 'text-white',
  /** Black text */
  black: 'text-black',
  /** Transparent */
  transparent: 'text-transparent',
  /** Current color (inherits from parent) */
  current: 'text-current',

  // Direct color access
  green: 'text-green-600 dark:text-green-400',
  blue: 'text-blue-600 dark:text-blue-400',
  red: 'text-red-600 dark:text-red-400',
  amber: 'text-amber-600 dark:text-amber-400',
  /** Amber (500 shade) */
  amber500: 'text-amber-500',
  yellow: 'text-yellow-600 dark:text-yellow-400',
  orange: 'text-orange-600 dark:text-orange-400',
  /** Orange (500 shade) */
  orange500: 'text-orange-500',
  purple: 'text-purple-600 dark:text-purple-400',
  /** Purple (500 shade) */
  purple500: 'text-purple-500 dark:text-purple-400',
  /** Blue (500 shade) */
  blue500: 'text-blue-500 dark:text-blue-400',
  /** Green (500 shade) */
  green500: 'text-green-500 dark:text-green-400',
  pink: 'text-pink-600 dark:text-pink-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  /** Zinc neutral (500 shade) */
  zinc: 'text-zinc-500 dark:text-zinc-400',
  /** Zinc neutral (400 shade) */
  zinc400: 'text-zinc-400',
  /** Slate (400 shade) */
  slate400: 'text-slate-400',
  /** Slate (700 shade) */
  slate700: 'text-slate-700',
  
  // Red shades
  /** Red (700 shade) */
  red700: 'text-red-700',
  /** Red (600 shade) */
  red600: 'text-red-600',
  /** Red (400 shade) */
  red400: 'text-red-400',
  /** Red (300 shade) */
  red300: 'text-red-300',
  
  // Yellow shades
  /** Yellow (600 shade) */
  yellow600: 'text-yellow-600',
  /** Yellow (400 shade) */
  yellow400: 'text-yellow-400',
  
  // Amber shades
  /** Amber (400 shade) */
  amber400: 'text-amber-400',
  /** Amber (300 shade) */
  amber300: 'text-amber-300',
  /** Amber (700 shade) */
  amber700: 'text-amber-700',
  
  // Purple shades
  /** Purple (400 shade) */
  purple400: 'text-purple-400',
  /** Purple (300 shade) */
  purple300: 'text-purple-300',
  /** Purple (400/80 opacity) */
  purple400_80: 'text-purple-400/80',
  
  // Blue shades
  /** Blue (400 shade) */
  blue400: 'text-blue-400',
  /** Blue (300 shade) */
  blue300: 'text-blue-300',
  /** Blue (400/80 opacity) */
  blue400_80: 'text-blue-400/80',
  
  // Green shades
  /** Green (600 shade) */
  green600: 'text-green-600',
  /** Green (400 shade) */
  green400: 'text-green-400',
  /** Green (300 shade) */
  green300: 'text-green-300',
  /** Green (400/80 opacity) */
  green400_80: 'text-green-400/80',
  
  // Orange shades
  /** Orange (400 shade) */
  orange400: 'text-orange-400',
  /** Orange (600 shade) - Medium text */
  orange600: 'text-orange-600',
  /** Orange (900 shade) - Dark text */
  orange900: 'text-orange-900',
  /** Orange (200 shade) - Light text */
  orange200: 'text-orange-200',
  
  // Additional color shades (400)
  /** Gray (400 shade) */
  gray400: 'text-gray-400',
  /** Gray (600 shade) */
  gray600: 'text-gray-600',
  /** Gray (100 shade) */
  gray100: 'text-gray-100',
  
  // Border color
  /** Border color as text */
  border: 'text-border',
  
  // Red with opacity
  /** Red with 80% opacity */
  red80: 'text-red/80',
  /** Red (800 shade) */
  red800: 'text-red-800',
  /** Red (200 shade) */
  red200: 'text-red-200',
  /** Red (800 shade) with dark mode variant (200) */
  red800Dark: 'text-red-800 dark:text-red-200',
  
  // Yellow with dark mode variants
  /** Yellow (800 shade) */
  yellow800: 'text-yellow-800',
  /** Yellow (200 shade) */
  yellow200: 'text-yellow-200',
  /** Yellow (800 shade) with dark mode variant (200) */
  yellow800Dark: 'text-yellow-800 dark:text-yellow-200',
  
  // Blue with dark mode variants
  /** Blue (800 shade) */
  blue800: 'text-blue-800',
  /** Blue (200 shade) */
  blue200: 'text-blue-200',
  /** Blue (800 shade) with dark mode variant (200) */
  blue800Dark: 'text-blue-800 dark:text-blue-200',
  
  // Brand colors
  /** Twitter brand blue (#1DA1F2) */
  twitterBlue: 'text-[#1DA1F2]',
  /** LinkedIn brand blue (#0A66C2) */
  linkedInBlue: 'text-[#0A66C2]',
  
  // Emerald text colors
  /** Emerald (900 shade) */
  emerald900: 'text-emerald-900',
  /** Emerald (100 shade) */
  emerald100Text: 'text-emerald-100',
  /** Emerald (900 shade) with dark mode variant (100) */
  emerald900Dark: 'text-emerald-900 dark:text-emerald-100',
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
  /** Popover background */
  popover: 'bg-popover',
  /** Muted background */
  muted: 'bg-muted',
  /** Primary brand background */
  primary: 'bg-primary',
  /** Accent background */
  accent: 'bg-accent',
  /** Secondary background */
  secondary: 'bg-secondary',
  /** Input background */
  input: 'bg-input',
  /** Border color as background (for scrollbar thumb) */
  border: 'bg-border',
  /** Border color with 50% opacity */
  'border/50': 'bg-border/50',
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
  /** Zinc solid (400 shade) */
  zinc400: 'bg-zinc-400',
  /** Zinc solid (500 shade) */
  zinc500: 'bg-zinc-500',
  /** Zinc with dark mode variant (400/500) */
  zinc: 'bg-zinc-400 dark:bg-zinc-500',
  
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
  /** Red (100 shade) */
  red100: 'bg-red-100',
  /** Red extra dark (900) */
  redExtraDark: 'bg-red-900',
  /** Red (900 shade) */
  red900: 'bg-red-900',
  /** Red (900 shade) with 30% opacity */
  'red900/30': 'bg-red-900/30',
  /** Red (100 shade) with dark mode variant (900/30) */
  red100Dark: 'bg-red-100 dark:bg-red-900/30',
  /** Blue medium (100) */
  blueMedium: 'bg-blue-100',
  /** Blue extra dark (900) */
  blueExtraDark: 'bg-blue-900',
  /** Blue (100 shade) with dark mode variant (900/30) */
  blue100Dark: 'bg-blue-100 dark:bg-blue-900/30',
  /** Yellow (100 shade) with dark mode variant (900/30) */
  yellow100Dark: 'bg-yellow-100 dark:bg-yellow-900/30',
  /** Emerald (50 shade) */
  emerald50: 'bg-emerald-50',
  /** Emerald (200 shade) */
  emerald200: 'bg-emerald-200',
  /** Emerald (950 shade) with 40% opacity */
  'emerald950/40': 'bg-emerald-950/40',
  /** Emerald (100 shade) */
  emerald100: 'bg-emerald-100',
  /** Emerald (50 shade) with dark mode variant (950/40) */
  emerald50Dark: 'bg-emerald-50 dark:bg-emerald-950/40',

  // Semantic status backgrounds (with opacity)
  /** Success background */
  success: 'bg-green-500/10',
  /** Success background (5% opacity) */
  'success/5': 'bg-green-500/5',
  /** Success background (20% opacity) */
  'success/20': 'bg-green-500/20',
  /** Warning background */
  warning: 'bg-amber-500/10',
  /** Warning background (5% opacity) */
  'warning/5': 'bg-yellow-500/5',
  /** Warning background (20% opacity) */
  'warning/20': 'bg-yellow-500/20',
  /** Error background */
  error: 'bg-red-500/10',
  /** Error background (5% opacity) */
  'error/5': 'bg-red-500/5',
  /** Error background (20% opacity) */
  'error/20': 'bg-red-500/20',
  /** Info background */
  info: 'bg-blue-500/10',
  /** Info background (5% opacity) */
  'info/5': 'bg-blue-500/5',
  /** Info background (20% opacity) */
  'info/20': 'bg-blue-500/20',

  // Opacity variants for green
  'green/5': 'bg-green-500/5',
  'green/10': 'bg-green-500/10',
  'green/20': 'bg-green-500/20',
  // Opacity variants for blue
  'blue/10': 'bg-blue-500/10',
  'blue/30': 'bg-blue-500/30',

  // Opacity variants for purple
  'purple/5': 'bg-purple-500/5',
  'purple/10': 'bg-purple-500/10',
  'purple/20': 'bg-purple-500/20',
  'purple/30': 'bg-purple-500/30',
  
  // Opacity variants for amber
  'amber/5': 'bg-amber-500/5',
  'amber/10': 'bg-amber-500/10',
  'amber/20': 'bg-amber-500/20',
  
  // Opacity variants for orange
  'orange/5': 'bg-orange-500/5',
  'orange/10': 'bg-orange-500/10',
  'orange/50': 'bg-orange-500/50',
  /** Orange 200 with 20% opacity */
  'orange200/20': 'bg-orange-200/20',
  /** Orange 950 with 30% opacity */
  'orange950/30': 'bg-orange-950/30',
  
  // Opacity variants for red
  'red/10': 'bg-red-500/10',
  'red/20': 'bg-red-500/20',
  
  // Opacity variants for gray
  'gray/10': 'bg-gray-500/10',
  'gray/20': 'bg-gray-500/20',
  /** Gray (100 shade) */
  gray100: 'bg-gray-100',
  
  // Orange shade variants
  /** Orange (400 shade) */
  orange400: 'bg-orange-400',
  /** Orange (50 shade) - Light background */
  orange50: 'bg-orange-50',
  /** Orange (200 shade) - Light border */
  orange200: 'bg-orange-200',
  /** Orange (600 shade) - Medium text */
  orange600: 'bg-orange-600',
  /** Orange (900 shade) - Dark text */
  orange900: 'bg-orange-900',
  /** Orange (950 shade) - Very dark background */
  orange950: 'bg-orange-950',
  
  // Opacity variants for violet
  'violet/20': 'bg-violet-500/20',

  // Opacity variants for primary
  'primary/5': 'bg-primary/5',
  'primary/10': 'bg-primary/10',
  'primary/20': 'bg-primary/20',
  'primary/30': 'bg-primary/30',
  'primary/50': 'bg-primary/50',
  'primary/70': 'bg-primary/70',

  // Opacity variants for accent
  'accent/5': 'bg-accent/5',
  'accent/10': 'bg-accent/10',
  'accent/15': 'bg-accent/15',
  'accent/20': 'bg-accent/20',
  'accent/30': 'bg-accent/30',
  'accent/40': 'bg-accent/40',
  'accent/50': 'bg-accent/50',

  // Opacity variants for muted
  'muted/10': 'bg-muted/10',
  'muted/20': 'bg-muted/20',
  'muted/30': 'bg-muted/30',
  'muted/40': 'bg-muted/40',
  'muted/50': 'bg-muted/50',
  'muted/60': 'bg-muted/60',
  // Muted foreground opacity variants
  'mutedForeground/50': 'bg-muted-foreground/50',

  // Opacity variants for card
  'card/30': 'bg-card/30',
  'card/40': 'bg-card/40',
  'card/50': 'bg-card/50',
  'card/60': 'bg-card/60',
  'card/70': 'bg-card/70',
  'card/80': 'bg-card/80',
  'card/90': 'bg-card/90',
  'card/95': 'bg-card/95',

  // Opacity variants for background
  'background/50': 'bg-background/50',
  'background/60': 'bg-background/60',
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
  'white/30': 'bg-white/30',
  
  // Opacity variants for black (overlays)
  'black/40': 'bg-black/40',
  'black/50': 'bg-black/50',
  'black/60': 'bg-black/60',
  'black/70': 'bg-black/70',
  'black/80': 'bg-black/80',
  /** Black overlay for modals (80% opacity) */
  blackOverlay: 'bg-black/80',

  // Overlay backgrounds
  /** Modal overlay background */
  overlay: 'bg-black/60',
  
  // Brand colors
  /** Twitter brand blue background (#1DA1F2) with 20% opacity */
  'twitterBlue/20': 'bg-[#1DA1F2]/20',
  /** LinkedIn brand blue background (#0A66C2) with 20% opacity */
  'linkedInBlue/20': 'bg-[#0A66C2]/20',
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
  /** Muted foreground border */
  mutedForeground: 'border-muted-foreground',
  /** Muted foreground border with 25% opacity */
  'mutedForeground/25': 'border-muted-foreground/25',
  /** Muted foreground border with 30% opacity */
  'mutedForeground/30': 'border-muted-foreground/30',
  /** Muted foreground border with 50% opacity */
  'mutedForeground/50': 'border-muted-foreground/50',

  // Opacity variants for border
  'border/20': 'border-border/20',
  'border/30': 'border-border/30',
  'border/40': 'border-border/40',
  'border/50': 'border-border/50',
  'border/60': 'border-border/60',

  // Opacity variants for primary
  'primary/20': 'border-primary/20',
  'primary/30': 'border-primary/30',
  /** border-accent/30 - Accent border with 30% opacity */
  'accent/30': 'border-accent/30',
  'primary/50': 'border-primary/50',

  // Opacity variants for accent
  'accent/20': 'border-accent/20',
  'accent/40': 'border-accent/40',
  'accent/50': 'border-accent/50',
  /** Accent border with 70% opacity */
  'accent/70': 'border-accent/70',
  // Opacity variants for destructive
  'destructive/50': 'border-destructive/50',

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
  'green/20': 'border-green-500/20',
  'green/30': 'border-green-500/30',
  'green/50': 'border-green-500/50',
  blue: 'border-blue-500',
  /** Blue border with 20% opacity */
  'blue/20': 'border-blue-500/20',
  'blue/30': 'border-blue-500/30',
  'blue/50': 'border-blue-500/50',
  
  // Gray border colors
  gray: 'border-gray-500',
  'gray/20': 'border-gray-500/20',
  'gray/30': 'border-gray-500/30',
  /** Purple border with 20% opacity */
  'purple/20': 'border-purple-500/20',
  amber: 'border-amber-500',
  'amber/20': 'border-amber-500/20',
  'amber/30': 'border-amber-500/30',
  'amber/50': 'border-amber-500/50',
  orange: 'border-orange-500',
  'orange/30': 'border-orange-500/30',
  /** Orange 200 border */
  orange200: 'border-orange-200',
  /** Orange 200 with 20% opacity */
  'orange200/20': 'border-orange-200/20',
  yellow: 'border-yellow-500',
  'yellow/20': 'border-yellow-500/20',
  'yellow/30': 'border-yellow-500/30',
  'yellow/50': 'border-yellow-500/50',
  red: 'border-red-500',
  'red/20': 'border-red-500/20',
  'red/30': 'border-red-500/30',
  'red/50': 'border-red-500/50',
  /** White border with opacity */
  'white/20': 'border-white/20',
  /** White border with 10% opacity */
  'white/10': 'border-white/10',
  purple: 'border-purple-500',
  'purple/30': 'border-purple-500/30',
  pink: 'border-pink-500',
  'pink/30': 'border-pink-500/30',
  /** Emerald (200 shade) with dark mode variant (200/30) */
  emerald200Dark: 'border-emerald-200 dark:border-emerald-200/30',
} as const;

// =============================================================================
// TEXT ALIGNMENT
// =============================================================================

/**
 * Text alignment utilities.
 */
/**
 * Responsive text alignment utilities.
 */
export const textAlignResponsive = {
  /** sm:text-left - Left align at sm breakpoint */
  smLeft: 'sm:text-left',
} as const;

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
  /** From card/30 */
  card30: 'from-card/30',
  /** From card/50 */
  card50: 'from-card/50',
  /** From card/80 */
  card80: 'from-card/80',
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
  /** From accent/50 */
  accent50: 'from-accent/50',
  /** From accent/90 */
  accent90: 'from-accent/90',
  
  // Opacity variants for primary
  /** From primary/5 */
  primary5: 'from-primary/5',
  /** From primary/10 */
  primary10: 'from-primary/10',
  /** From primary/20 */
  primary20: 'from-primary/20',
  /** From primary/50 */
  primary50: 'from-primary/50',
  
  // Opacity variants for foreground
  /** From foreground/70 */
  foreground70: 'from-foreground/70',
  
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
  
  // Color-specific gradients (amber, orange, violet, emerald, teal, etc.)
  /** From amber-500/5 */
  amber5: 'from-amber-500/5',
  /** From amber-500/10 */
  amber10: 'from-amber-500/10',
  /** From amber-500/20 */
  amber20: 'from-amber-500/20',
  /** From amber-50/10 */
  amber50_10: 'from-amber-50/10',
  /** From amber-500/15 */
  amber15: 'from-amber-500/15',
  /** From orange-500/20 */
  orange20: 'from-orange-500/20',
  /** From violet-500/10 */
  violet10: 'from-violet-500/10',
  /** From violet-500/90 */
  violet90: 'from-violet-500/90',
  /** From emerald-500 */
  emerald: 'from-emerald-500',
  /** From emerald-600 */
  emerald600: 'from-emerald-600',
  /** From green-500/10 */
  green10: 'from-green-500/10',
  /** From green-500/20 */
  green20: 'from-green-500/20',
  /** From blue-500/10 */
  blue10: 'from-blue-500/10',
  /** From blue-500/20 */
  blue20: 'from-blue-500/20',
  /** From gray-500/10 */
  gray10: 'from-gray-500/10',
  /** From yellow-500/20 */
  yellow20: 'from-yellow-500/20',
  /** From purple-500/10 */
  purple10: 'from-purple-500/10',
  /** From fuchsia-500/10 */
  fuchsia10: 'from-fuchsia-500/10',
  /** From fuchsia-500/90 */
  fuchsia90: 'from-fuchsia-500/90',
  /** From teal-500 */
  teal: 'from-teal-500',
  /** From teal-600 */
  teal600: 'from-teal-600',
  /** From pink-500/10 */
  pink10: 'from-pink-500/10',
  
  // Border color gradients
  /** From border/50 */
  border50: 'from-border/50',
  /** From border */
  border: 'from-border',
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
  
  // Opacity variants for white (glass effects)
  /** Via white/5 */
  white5: 'via-white/5',
  /** Via white/10 */
  white10: 'via-white/10',
  /** Via white/20 */
  white20: 'via-white/20',
  /** Via white/30 */
  white30: 'via-white/30',
  
  // Opacity variants for accent
  /** Via accent/5 */
  accent5: 'via-accent/5',
  /** Via accent/90 */
  accent90: 'via-accent/90',
  
  // Opacity variants for card
  /** Via card/50 */
  card50: 'via-card/50',
  /** Via card/60 */
  card60: 'via-card/60',
  /** Via card/70 */
  card70: 'via-card/70',
  /** Via card/80 */
  card80: 'via-card/80',
  
  // Color-specific gradients
  /** Via fuchsia-500/10 */
  fuchsia10: 'via-fuchsia-500/10',
  
  // Border color gradients
  /** Via border */
  border: 'via-border',
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
  /** To background/95 */
  background95: 'to-background/95',
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
  /** To foreground/70 */
  foreground70: 'to-foreground/70',
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
  /** To primary/30 */
  primary30: 'to-primary/30',
  /** To primary/50 */
  primary50: 'to-primary/50',
  /** To primary/70 */
  primary70: 'to-primary/70',
  /** To primary/90 */
  primary90: 'to-primary/90',
  
  // Opacity variants for accent
  /** To accent/5 */
  accent5: 'to-accent/5',
  /** To accent/10 */
  accent10: 'to-accent/10',
  /** To accent/20 */
  accent20: 'to-accent/20',
  /** To accent/90 */
  accent90: 'to-accent/90',
  
  // Opacity variants for white (glass effects)
  /** To white/5 */
  white5: 'to-white/5',
  /** To white/10 */
  white10: 'to-white/10',
  
  // Opacity variants for card
  /** To card/30 */
  card30: 'to-card/30',
  /** To card/50 */
  card50: 'to-card/50',
  /** To card/95 */
  card95: 'to-card/95',
  
  // Color-specific gradients (amber, orange, violet, emerald, teal, etc.)
  /** To orange-500/5 */
  orange5: 'to-orange-500/5',
  /** To orange-500/20 */
  orange20: 'to-orange-500/20',
  /** To cyan-500/10 */
  cyan10: 'to-cyan-500/10',
  /** To slate-500/10 */
  slate10: 'to-slate-500/10',
  /** To violet-500/10 */
  violet10: 'to-violet-500/10',
  /** To violet-500/90 */
  violet90: 'to-violet-500/90',
  /** To emerald-500 */
  emerald: 'to-emerald-500',
  /** To emerald-500/10 */
  emerald10: 'to-emerald-500/10',
  /** To emerald-600 */
  emerald600: 'to-emerald-600',
  /** To teal-500 */
  teal: 'to-teal-500',
  /** To teal-600 */
  teal600: 'to-teal-600',
  /** To fuchsia-500/10 */
  fuchsia10: 'to-fuchsia-500/10',
  /** To fuchsia-500/90 */
  fuchsia90: 'to-fuchsia-500/90',
  /** To yellow-500/10 */
  yellow10: 'to-yellow-500/10',
  /** To yellow-500/15 */
  yellow15: 'to-yellow-500/15',
  /** To pink-500/10 */
  pink10: 'to-pink-500/10',
  
  // Border color gradients
  /** To border */
  border: 'to-border',
  /** To border/50 */
  border50: 'to-border/50',
} as const;

// =============================================================================
// STATE COLORS (Combined Text + Border + Background)
// =============================================================================

/**
 * State color utilities combining text, border, and background for semantic states.
 * 
 * @migration Replaces SEMANTIC_COLORS from @heyclaude/web-runtime/ui
 * @example
 * // ❌ OLD: className={SEMANTIC_COLORS.SUCCESS}
 * // ✅ NEW: className={`${stateColor.success.text} ${stateColor.success.border} ${stateColor.success.bg}`}
 * // Or use the combined pattern:
 * // ✅ NEW: className={stateColor.success.default}
 */
export const stateColor = {
  // Success states (green)
  success: {
    /** Combined: text-green-400 border-green-500/50 bg-green-500/10 */
    default: `${textColor.success400} ${borderColor['green/50']} ${bgColor.success}`,
    /** Combined: text-green-400 border-green-500/20 bg-green-500/5 */
    subtle: `${textColor.success400} ${borderColor['green/20']} ${bgColor['success/5']}`,
    /** Combined: text-green-400 border-green-500 bg-green-500/20 */
    bold: `${textColor.success400} ${borderColor.green} ${bgColor['success/20']}`,
    /** Text only */
    text: textColor.success400,
    /** Border only */
    border: borderColor['green/50'],
    /** Background only */
    bg: bgColor.success,
  },
  // Warning states (yellow)
  warning: {
    /** Combined: text-yellow-400 border-yellow-500/50 bg-yellow-500/10 */
    default: `${textColor.warning400} ${borderColor['yellow/50']} ${bgColor.warning}`,
    /** Combined: text-yellow-400 border-yellow-500/20 bg-yellow-500/5 */
    subtle: `${textColor.warning400} ${borderColor['yellow/20']} ${bgColor['warning/5']}`,
    /** Combined: text-yellow-400 border-yellow-500 bg-yellow-500/20 */
    bold: `${textColor.warning400} ${borderColor.yellow} ${bgColor['warning/20']}`,
    /** Text only */
    text: textColor.warning400,
    /** Border only */
    border: borderColor['yellow/50'],
    /** Background only */
    bg: bgColor.warning,
  },
  // Error states (red)
  error: {
    /** Combined: text-red-400 border-red-500/50 bg-red-500/10 */
    default: `${textColor.error400} ${borderColor['red/50']} ${bgColor.error}`,
    /** Combined: text-red-400 border-red-500/20 bg-red-500/5 */
    subtle: `${textColor.error400} ${borderColor['red/20']} ${bgColor['error/5']}`,
    /** Combined: text-red-400 border-red-500 bg-red-500/20 */
    bold: `${textColor.error400} ${borderColor.red} ${bgColor['error/20']}`,
    /** Text only */
    text: textColor.error400,
    /** Border only */
    border: borderColor['red/50'],
    /** Background only */
    bg: bgColor.error,
  },
  // Info states (blue)
  info: {
    /** Combined: text-blue-400 border-blue-500/50 bg-blue-500/10 */
    default: `${textColor.info400} ${borderColor['blue/50']} ${bgColor.info}`,
    /** Combined: text-blue-400 border-blue-500/20 bg-blue-500/5 */
    subtle: `${textColor.info400} ${borderColor['blue/20']} ${bgColor['info/5']}`,
    /** Combined: text-blue-400 border-blue-500 bg-blue-500/20 */
    bold: `${textColor.info400} ${borderColor.blue} ${bgColor['info/20']}`,
    /** Text only */
    text: textColor.info400,
    /** Border only */
    border: borderColor['blue/50'],
    /** Background only */
    bg: bgColor.info,
  },
  // Featured/Sponsored (gradient patterns)
  featured: {
    /** Combined featured gradient pattern */
    default: `text-amber-600 dark:text-amber-400 ${borderColor['amber/30']} ${bgGradient.toR} ${gradientFrom.amber10} ${gradientTo.yellow10}`,
  },
  sponsored: {
    /** Combined sponsored gradient pattern */
    default: `text-purple-600 dark:text-purple-400 ${borderColor['purple/30']} ${bgGradient.toR} ${gradientFrom.purple10} ${gradientTo.pink10}`,
  },
  // Social proof colors (text only)
  social: {
    /** View counts */
    view: textColor.blue,
    /** Copy/usage counts */
    copy: textColor.green,
    /** Bookmark counts */
    bookmark: textColor.amber,
  },
  // Swipe gesture feedback
  swipe: {
    /** Copy swipe indicator */
    copy: `text-green-600 dark:text-green-400 ${borderColor['green/30']} ${bgColor['success/20']}`,
    /** Bookmark swipe indicator */
    bookmark: `text-blue-600 dark:text-blue-400 ${borderColor['blue/30']} ${bgColor['info/20']}`,
  },
} as const;

// =============================================================================
// INFOBOX COLORS (Left Border + Background Pattern)
// =============================================================================

/**
 * InfoBox/Alert variant colors (left border + subtle background).
 * 
 * @migration Replaces INFOBOX_COLORS from @heyclaude/web-runtime/ui
 * @example
 * // ❌ OLD: className={INFOBOX_COLORS.INFO}
 * // ✅ NEW: className={`border-l-4 ${infoBoxColor.info.border} ${infoBoxColor.info.bg}`}
 * // Or use the combined pattern:
 * // ✅ NEW: className={`border-l-4 ${infoBoxColor.info.default}`}
 */
export const infoBoxColor = {
  info: {
    /** Combined: border-l-4 border-blue-500 bg-blue-500/5 */
    default: `border-l-4 ${borderColor.blue} ${bgColor['info/5']}`,
    /** Border only (for border-l-4) */
    border: borderColor.blue,
    /** Background only */
    bg: bgColor['info/5'],
  },
  warning: {
    /** Combined: border-l-4 border-yellow-500 bg-yellow-500/5 */
    default: `border-l-4 ${borderColor.yellow} ${bgColor['warning/5']}`,
    /** Border only (for border-l-4) */
    border: borderColor.yellow,
    /** Background only */
    bg: bgColor['warning/5'],
  },
  success: {
    /** Combined: border-l-4 border-green-500 bg-green-500/5 */
    default: `border-l-4 ${borderColor.green} ${bgColor['success/5']}`,
    /** Border only (for border-l-4) */
    border: borderColor.green,
    /** Background only */
    bg: bgColor['success/5'],
  },
  error: {
    /** Combined: border-l-4 border-red-500 bg-red-500/5 */
    default: `border-l-4 ${borderColor.red} ${bgColor['error/5']}`,
    /** Border only (for border-l-4) */
    border: borderColor.red,
    /** Background only */
    bg: bgColor['error/5'],
  },
} as const;

// =============================================================================
// SUBMISSION FORM COLOR VALUES (for inline styles & motion.dev)
// =============================================================================

/**
 * Submission form color values for inline styles and motion.dev animate props.
 * These are actual color values (OKLCH) used in the submission form wizard.
 * 
 * @migration Replaces SUBMISSION_FORM_TOKENS.colors for inline style usage
 * @example
 * // ❌ OLD: style={{ backgroundColor: TOKENS.colors.background.primary }}
 * // ✅ NEW: style={{ backgroundColor: submissionFormColors.background.primary }}
 * // ❌ OLD: animate={{ borderColor: TOKENS.colors.accent.primary }}
 * // ✅ NEW: animate={{ borderColor: submissionFormColors.accent.primary }}
 */
export const submissionFormColors = {
  background: {
    primary: 'oklch(24% 0.008 60)',
    secondary: 'oklch(28% 0.006 60)',
    tertiary: 'oklch(32% 0.008 60)',
    elevated: 'oklch(36% 0.009 60)',
    overlay: 'oklch(18% 0.005 0 / 0.8)',
    code: 'oklch(12% 0.003 60)',
  },
  text: {
    primary: 'oklch(94% 0.005 60)',
    secondary: 'oklch(78% 0.008 60)',
    tertiary: 'oklch(72% 0.01 60)',
    disabled: 'oklch(57% 0.012 60)',
    inverse: '#FFFFFF',
    placeholder: 'oklch(57% 0.012 60)',
  },
  accent: {
    primary: 'oklch(74% 0.2 35)',
    hover: 'oklch(78% 0.19 35)',
    active: 'oklch(70% 0.21 35)',
    light: 'oklch(82% 0.17 37)',
    muted: 'oklch(65% 0.18 33)',
    glow: 'oklch(74% 0.2 35 / 0.15)',
    subtle: 'oklch(45% 0.08 35)',
  },
  border: {
    default: 'oklch(30% 0.005 60 / 0.5)',
    light: 'oklch(28% 0.005 60 / 0.3)',
    medium: 'oklch(34% 0.008 60 / 0.6)',
    strong: 'oklch(74% 0.2 35)',
    focus: 'oklch(74% 0.2 35 / 0.4)',
  },
  success: {
    text: 'oklch(72% 0.19 145)',
    bg: 'oklch(35% 0.08 145 / 0.15)',
    border: 'oklch(64% 0.19 145 / 0.3)',
    glow: 'oklch(72% 0.19 145 / 0.15)',
  },
  error: {
    text: 'oklch(70% 0.195 25)',
    bg: 'oklch(40% 0.08 25 / 0.15)',
    border: 'oklch(63% 0.195 25 / 0.3)',
    glow: 'oklch(70% 0.195 25 / 0.15)',
  },
  warning: {
    text: 'oklch(75% 0.155 65)',
    bg: 'oklch(45% 0.08 65 / 0.15)',
    border: 'oklch(68% 0.155 65 / 0.3)',
    glow: 'oklch(75% 0.155 65 / 0.15)',
  },
  info: {
    text: 'oklch(78% 0.168 250)',
    bg: 'oklch(40% 0.08 250 / 0.15)',
    border: 'oklch(65% 0.168 250 / 0.3)',
    glow: 'oklch(78% 0.168 250 / 0.15)',
  },
  category: {
    agents: 'oklch(64% 0.19 145)',
    mcp: 'oklch(58% 0.195 305)',
    rules: 'oklch(58% 0.19 250)',
    commands: 'oklch(77% 0.2 38)',
    hooks: 'oklch(65% 0.24 350)',
    statuslines: 'oklch(60% 0.2 290)',
    skills: 'oklch(65% 0.2 310)',
  },
  field: {
    idle: 'oklch(26% 0.006 60)',
    hover: 'oklch(28% 0.008 60)',
    focus: 'oklch(28% 0.008 60)',
    filled: 'oklch(24% 0.008 60)',
    disabled: 'oklch(24% 0.005 60)',
    error: 'oklch(26% 0.006 60)',
  },
} as const;
