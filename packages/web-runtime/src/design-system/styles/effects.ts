/**
 * Visual Effects Utilities
 *
 * Shadows, z-index layers, backdrops, and gradients.
 * Consolidates scattered inline patterns into semantic utilities.
 *
 * @module web-runtime/design-system/styles/effects
 */

// =============================================================================
// SHADOWS
// =============================================================================

/**
 * Shadow utilities for elevation and depth.
 */
export const shadow = {
  /** No shadow */
  none: 'shadow-none',
  /** Subtle shadow for cards */
  sm: 'shadow-sm',
  /** Default shadow */
  default: 'shadow',
  /** Medium shadow for elevated elements */
  md: 'shadow-md',
  /** Large shadow for modals/dropdowns */
  lg: 'shadow-lg',
  /** Extra large shadow for popovers */
  xl: 'shadow-xl',
  /** Maximum shadow for floating elements */
  '2xl': 'shadow-2xl',
  /** Inner shadow for inset effects */
  inner: 'shadow-inner',
} as const;

/**
 * Colored shadow utilities (for glows and accents).
 */
export const shadowColor = {
  /** Accent glow */
  accent: 'shadow-accent/20',
  /** Primary glow */
  primary: 'shadow-primary/20',
  /** Error/destructive glow */
  destructive: 'shadow-destructive/20',
  /** Success glow */
  success: 'shadow-green-500/20',
  /** Warning glow */
  warning: 'shadow-yellow-500/20',
} as const;

// =============================================================================
// Z-INDEX LAYERS
// =============================================================================

/**
 * Z-index layers for stacking context.
 * Use semantic names instead of arbitrary numbers.
 */
export const zLayer = {
  /** Below everything (backgrounds) */
  behind: 'z-[-1]',
  /** Base layer */
  base: 'z-0',
  /** Slightly elevated (cards, dropdowns) */
  raised: 'z-10',
  /** Sticky elements */
  sticky: 'z-20',
  /** Fixed elements (headers, footers) */
  fixed: 'z-30',
  /** Overlays (modals backdrop) */
  overlay: 'z-40',
  /** Modal content */
  modal: 'z-50',
  /** Popovers and tooltips */
  popover: 'z-[60]',
  /** Toast notifications */
  toast: 'z-[70]',
  /** Maximum (dev tools, critical UI) */
  max: 'z-[100]',
} as const;

// =============================================================================
// BACKDROP EFFECTS
// =============================================================================

/**
 * Backdrop blur utilities for glassmorphism effects.
 */
export const backdrop = {
  /** No blur */
  none: 'backdrop-blur-none',
  /** Subtle blur */
  sm: 'backdrop-blur-sm',
  /** Default blur */
  default: 'backdrop-blur',
  /** Medium blur */
  md: 'backdrop-blur-md',
  /** Large blur */
  lg: 'backdrop-blur-lg',
  /** Extra large blur */
  xl: 'backdrop-blur-xl',
  /** Maximum blur */
  '2xl': 'backdrop-blur-2xl',
  /** Heavy blur for modals */
  '3xl': 'backdrop-blur-3xl',
} as const;

// =============================================================================
// OPACITY UTILITIES
// =============================================================================

/**
 * Opacity utilities.
 * Named `opacityLevel` to avoid conflict with tokens.opacity
 */
export const opacityLevel = {
  /** Fully transparent */
  0: 'opacity-0',
  /** Very faint */
  5: 'opacity-5',
  /** Faint */
  10: 'opacity-10',
  /** Light */
  20: 'opacity-20',
  /** Subtle */
  30: 'opacity-30',
  /** Medium-light */
  40: 'opacity-40',
  /** Half */
  50: 'opacity-50',
  /** Medium */
  60: 'opacity-60',
  /** Prominent */
  70: 'opacity-70',
  /** Strong */
  80: 'opacity-80',
  /** Near full */
  90: 'opacity-90',
  /** Slight fade */
  95: 'opacity-95',
  /** Fully visible */
  100: 'opacity-100',
} as const;

// =============================================================================
// GRADIENT UTILITIES
// =============================================================================

/**
 * Gradient direction utilities.
 */
export const gradientDir = {
  /** Top to bottom */
  toB: 'bg-gradient-to-b',
  /** Bottom to top */
  toT: 'bg-gradient-to-t',
  /** Left to right */
  toR: 'bg-gradient-to-r',
  /** Right to left */
  toL: 'bg-gradient-to-l',
  /** Top-left to bottom-right */
  toBr: 'bg-gradient-to-br',
  /** Top-right to bottom-left */
  toBl: 'bg-gradient-to-bl',
  /** Bottom-left to top-right */
  toTr: 'bg-gradient-to-tr',
  /** Bottom-right to top-left */
  toTl: 'bg-gradient-to-tl',
} as const;

/**
 * Common gradient patterns.
 */
export const gradient = {
  /** Subtle fade from transparent */
  fadeUp: 'bg-gradient-to-t from-background to-transparent',
  /** Subtle fade to transparent */
  fadeDown: 'bg-gradient-to-b from-background to-transparent',
  /** Accent to primary */
  accentPrimary: 'bg-gradient-to-r from-accent to-primary',
  /** Primary to accent */
  primaryAccent: 'bg-gradient-to-r from-primary to-accent',
  /** Muted gradient for cards */
  muted: 'bg-gradient-to-br from-muted/50 to-muted/20',
  /** Hero gradient */
  hero: 'bg-gradient-to-b from-background via-background to-muted/20',
  /** Glass effect base */
  glass: 'bg-gradient-to-br from-white/10 to-white/5',
} as const;

// =============================================================================
// GLOW EFFECTS
// =============================================================================

/**
 * Glow effects for interactive/highlighted elements.
 */
export const glow = {
  /** Accent glow */
  accent: 'shadow-lg shadow-accent/20',
  /** Primary glow */
  primary: 'shadow-lg shadow-primary/20',
  /** Subtle glow */
  subtle: 'shadow-md shadow-foreground/5',
  /** Success glow */
  success: 'shadow-lg shadow-green-500/20',
  /** Warning glow */
  warning: 'shadow-lg shadow-yellow-500/20',
  /** Error glow */
  error: 'shadow-lg shadow-red-500/20',
} as const;

// =============================================================================
// BLUR UTILITIES (for elements, not backdrop)
// =============================================================================

/**
 * Element blur utilities.
 */
export const blur = {
  none: 'blur-none',
  sm: 'blur-sm',
  default: 'blur',
  md: 'blur-md',
  lg: 'blur-lg',
  xl: 'blur-xl',
  '2xl': 'blur-2xl',
  '3xl': 'blur-3xl',
} as const;
