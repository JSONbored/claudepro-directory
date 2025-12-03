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
  /** Accent glow shadow (orange rgba) */
  accentGlow: 'shadow-[0_10px_40px_-20px_rgba(255,138,76,0.8)]',
} as const;

/**
 * Colored shadow utilities (for glows and accents).
 * 
 * @migration Replaces inline `shadow-*` color Tailwind classes
 * @example
 * // ❌ OLD: className="shadow-accent/20"
 * // ✅ NEW: className={shadowColor.accent}
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
  /** Info glow */
  info: 'shadow-blue-500/20',
  /** Black shadow (for depth) */
  black: 'shadow-black/10',
  /** Black stronger shadow */
  blackStrong: 'shadow-black/20',
  /** Red glow */
  red: 'shadow-red-500/20',
  /** Purple glow */
  purple: 'shadow-purple-500/20',
  /** Amber glow */
  amber: 'shadow-amber-500/20',
  /** Emerald glow (stronger opacity) */
  emerald: 'shadow-emerald-500/50',
  /** Blue glow (stronger opacity) */
  blue: 'shadow-blue-500/50',
  /** Orange glow (stronger opacity) */
  orange: 'shadow-orange-500/50',
} as const;

/**
 * Hover shadow utilities (for interactive glows).
 * 
 * @migration Replaces inline `hover:shadow-*` Tailwind classes
 * @example
 * // ❌ OLD: className="hover:shadow-[0_10px_40px_-20px_rgba(255,138,76,0.6)]"
 * // ✅ NEW: className={hoverShadow.accentGlow}
 */
export const hoverShadow = {
  /** Accent glow on hover (orange rgba) */
  accentGlow: 'hover:shadow-[0_10px_40px_-20px_rgba(255,138,76,0.6)]',
  /** Accent glow on hover (stronger) */
  accentGlowStrong: 'hover:shadow-[0_10px_40px_-20px_rgba(255,138,76,0.8)]',
} as const;

// =============================================================================
// Z-INDEX LAYERS
// =============================================================================

/**
 * Z-index layers for stacking context.
 * Use semantic names instead of arbitrary numbers.
 * 
 * @migration Replaces inline `z-*` Tailwind classes
 * @example
 * // ❌ OLD: className="z-10"
 * // ✅ NEW: className={zLayer.raised}
 * // ❌ OLD: className="z-50"
 * // ✅ NEW: className={zLayer.modal}
 */
export const zLayer = {
  /** Below everything (backgrounds) - z-[-1] */
  behind: 'z-[-1]',
  /** Behind elements (ambient effects) - -z-10 */
  behind10: '-z-10',
  /** Base layer - z-0 */
  base: 'z-0',
  /** Slightly elevated (cards, dropdowns) - z-10 */
  raised: 'z-10',
  /** Above raised (floating elements) - z-20 */
  above: 'z-20',
  /** Sticky elements - z-30 */
  sticky: 'z-30',
  /** Fixed elements (headers, footers) - z-40 */
  fixed: 'z-40',
  /** Overlays (modals backdrop) - z-40 */
  overlay: 'z-40',
  /** Modal content - z-50 */
  modal: 'z-50',
  /** Popovers and tooltips - z-60 */
  popover: 'z-[60]',
  /** Toast notifications - z-70 */
  toast: 'z-[70]',
  /** Maximum (dev tools, critical UI) - z-100 */
  max: 'z-[100]',
  
  // Numeric aliases for direct mapping
  /** z-10 */
  10: 'z-10',
  /** z-20 */
  20: 'z-20',
  /** z-30 */
  30: 'z-30',
  /** z-40 */
  40: 'z-40',
  /** z-50 */
  50: 'z-50',
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
  /** Strong (75%) */
  75: 'opacity-75',
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
 * 
 * @migration Replaces SUBMISSION_FORM_TOKENS.shadows.glow
 * @example
 * // ❌ OLD: style={{ boxShadow: TOKENS.shadows.glow.orange }}
 * // ✅ NEW: style={{ boxShadow: glowShadow.orange }}
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

/**
 * Glow shadow values for inline styles (OKLCH colors).
 * Used in submission form wizard components.
 * 
 * @migration Replaces SUBMISSION_FORM_TOKENS.shadows.glow
 * @example
 * // ❌ OLD: style={{ boxShadow: TOKENS.shadows.glow.orange }}
 * // ✅ NEW: style={{ boxShadow: glowShadow.orange }}
 */
export const glowShadow = {
  /** Orange glow (Claude accent) */
  orange: '0 0 0 4px oklch(74% 0.2 35 / 0.15)',
  /** Green glow (success) */
  green: '0 0 0 4px oklch(72% 0.19 145 / 0.15)',
  /** Red glow (error) */
  red: '0 0 0 4px oklch(70% 0.195 25 / 0.15)',
  /** Blue glow (info) */
  blue: '0 0 0 4px oklch(78% 0.168 250 / 0.15)',
  /** Soft glow (subtle) */
  soft: '0 8px 32px -4px oklch(60% 0.2 280 / 0.15)',
  /** Medium glow (more visible) */
  medium: '0 12px 48px -8px oklch(60% 0.2 280 / 0.25)',
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

// =============================================================================
// OUTLINE UTILITIES
// =============================================================================

/**
 * Outline utilities for focus states and borders without affecting layout.
 * 
 * @migration Replaces inline `outline-*` Tailwind classes
 * @example
 * // ❌ OLD: className="outline-none"
 * // ✅ NEW: className={outline.none}
 * // ❌ OLD: className="outline outline-2 outline-offset-2"
 * // ✅ NEW: className={outline.ring}
 * 
 * @see {@link focusRing} in interactive.ts - For focus ring patterns
 */
export const outline = {
  /** outline-none - Remove outline */
  none: 'outline-none',
  /** outline - Default outline */
  default: 'outline',
  /** outline-dashed */
  dashed: 'outline-dashed',
  /** outline-dotted */
  dotted: 'outline-dotted',
  /** outline-double */
  double: 'outline-double',
} as const;

/**
 * Outline width utilities.
 * 
 * @migration Replaces inline `outline-*` width Tailwind classes
 */
export const outlineWidth = {
  /** outline-0 */
  0: 'outline-0',
  /** outline-1 */
  1: 'outline-1',
  /** outline-2 */
  2: 'outline-2',
  /** outline-4 */
  4: 'outline-4',
  /** outline-8 */
  8: 'outline-8',
} as const;

/**
 * Outline offset utilities.
 * 
 * @migration Replaces inline `outline-offset-*` Tailwind classes
 */
export const outlineOffset = {
  /** outline-offset-0 */
  0: 'outline-offset-0',
  /** outline-offset-1 */
  1: 'outline-offset-1',
  /** outline-offset-2 */
  2: 'outline-offset-2',
  /** outline-offset-4 */
  4: 'outline-offset-4',
  /** outline-offset-8 */
  8: 'outline-offset-8',
} as const;

/**
 * Outline color utilities.
 * 
 * @migration Replaces inline outline color Tailwind classes
 */
export const outlineColor = {
  /** outline-transparent */
  transparent: 'outline-transparent',
  /** outline-current */
  current: 'outline-current',
  /** outline-inherit */
  inherit: 'outline-inherit',
  /** Primary color outline */
  primary: 'outline-primary',
  /** Accent color outline */
  accent: 'outline-accent',
  /** Destructive color outline */
  destructive: 'outline-destructive',
  /** Ring color (for focus states) */
  ring: 'outline-ring',
} as const;

/**
 * Combined outline patterns for common use cases.
 * 
 * @migration Replaces common inline outline pattern combinations
 * @example
 * // ❌ OLD: className="outline outline-2 outline-offset-2 outline-ring"
 * // ✅ NEW: className={outlinePattern.focusRing}
 */
export const outlinePattern = {
  /** Standard focus ring outline */
  focusRing: 'outline outline-2 outline-offset-2 outline-ring',
  /** Subtle focus outline */
  focusSubtle: 'outline outline-1 outline-ring/50',
  /** Error state outline */
  error: 'outline outline-2 outline-destructive',
  /** Success state outline */
  success: 'outline outline-2 outline-green-500',
  /** Selection outline */
  selected: 'outline outline-2 outline-accent',
} as const;

// =============================================================================
// RING UTILITIES (for focus rings and decorative rings)
// =============================================================================

/**
 * Ring utilities for focus states and decorative rings.
 * 
 * @migration Replaces inline `ring-*`, `ring-offset-*` Tailwind classes
 * @example
 * // ❌ OLD: className="ring-2 ring-accent/20 ring-offset-2 ring-offset-background"
 * // ✅ NEW: className={ring.accent20}
 */
export const ring = {
  /** ring-2 ring-accent/20 ring-offset-2 ring-offset-background - Accent ring with offset */
  accent20: 'ring-2 ring-accent/20 ring-offset-2 ring-offset-background',
  /** ring-offset-background - Ring offset background color */
  offsetBackground: 'ring-offset-background',
  /** ring-0 - No ring */
  none: 'ring-0',
} as const;

// =============================================================================
// BACKGROUND CLIP UTILITIES
// =============================================================================

/**
 * Background clip utilities for text gradients.
 * 
 * @migration Replaces inline `bg-clip-text` Tailwind classes
 * @example
 * // ❌ OLD: className="bg-clip-text"
 * // ✅ NEW: className={bgClip.text}
 */
export const bgClip = {
  /** Clip background to text */
  text: 'bg-clip-text',
  /** Clip background to padding box */
  padding: 'bg-clip-padding',
  /** Clip background to content box */
  content: 'bg-clip-content',
  /** Clip background to border box */
  border: 'bg-clip-border',
} as const;
