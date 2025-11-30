/**
 * Unified Design Tokens
 *
 * SINGLE SOURCE OF TRUTH for the entire design system.
 *
 * All colors, spacing, typography, animations, and other design values
 * are defined here. Other files (globals.css, constants.ts, etc.) should
 * reference these tokens or be generated from them.
 *
 * Organization:
 * - colors: Brand, semantic, backgrounds, text, borders, categories
 * - spacing: Consistent spacing scale
 * - typography: Font families, sizes, weights, line heights
 * - animation: Spring configs, durations, easings
 * - borders: Radius and width values
 * - shadows: Elevation and glow effects
 * - breakpoints: Responsive design breakpoints
 * - zIndex: Stacking context layers
 *
 * @module web-runtime/design-system/tokens
 */

// =============================================================================
// COLOR TOKENS
// =============================================================================

/**
 * All colors use OKLCH color space for perceptual uniformity.
 * Format: oklch(lightness chroma hue / alpha)
 *
 * OKLCH benefits:
 * - Perceptually uniform (equal steps = equal visual difference)
 * - Better dark mode generation
 * - More predictable color mixing
 * - P3 wide gamut support
 */
export const colors = {
  // -------------------------------------------------------------------------
  // BRAND COLORS - Claude Orange
  // -------------------------------------------------------------------------
  brand: {
    /** Primary brand color - Claude orange (#F97316 equivalent) */
    orange: 'oklch(74% 0.2 35)',
    /** Hover state - slightly lighter */
    orangeHover: 'oklch(78% 0.19 35)',
    /** Active/pressed state - slightly darker */
    orangeActive: 'oklch(70% 0.21 35)',
    /** Light variant for subtle backgrounds */
    orangeLight: 'oklch(82% 0.17 37)',
    /** Muted variant for secondary elements */
    orangeMuted: 'oklch(65% 0.18 33)',
    /** Very subtle for barely-visible accents */
    orangeSubtle: 'oklch(45% 0.08 35)',
  },

  // -------------------------------------------------------------------------
  // DARK MODE BACKGROUNDS
  // -------------------------------------------------------------------------
  dark: {
    bg: {
      /** Primary background - deepest */
      primary: 'oklch(24% 0.008 60)',
      /** Secondary background - cards, elevated surfaces */
      secondary: 'oklch(28% 0.006 60)',
      /** Tertiary background - hover states, subtle elevation */
      tertiary: 'oklch(32% 0.008 60)',
      /** Quaternary - active states, higher elevation */
      quaternary: 'oklch(36% 0.009 60)',
      /** Selected state background */
      selected: 'oklch(40% 0.01 60)',
      /** Code block background - darkest */
      code: 'oklch(12% 0.003 60)',
      /** Overlay/modal backdrop */
      overlay: 'oklch(18% 0.005 0 / 0.8)',
    },
    text: {
      /** Primary text - highest contrast */
      primary: 'oklch(94% 0.005 60)',
      /** Secondary text - slightly muted */
      secondary: 'oklch(78% 0.008 60)',
      /** Tertiary text - labels, captions */
      tertiary: 'oklch(72% 0.01 60)',
      /** Disabled text - lowest contrast */
      disabled: 'oklch(57% 0.012 60)',
      /** Inverse text - for on-accent backgrounds */
      inverse: 'oklch(100% 0 0)',
    },
    border: {
      /** Default border - subtle */
      default: 'oklch(30% 0.005 60 / 0.5)',
      /** Light border - very subtle */
      light: 'oklch(28% 0.005 60 / 0.3)',
      /** Medium border - more visible */
      medium: 'oklch(34% 0.008 60 / 0.6)',
      /** Strong border - accent color */
      strong: 'oklch(74% 0.2 35)',
    },
    shadow: {
      xs: '0 1px 2px oklch(0% 0 0 / 0.02)',
      sm: '0 1px 2px oklch(0% 0 0 / 0.04)',
      md: '0 2px 4px oklch(0% 0 0 / 0.06), 0 1px 2px oklch(0% 0 0 / 0.04)',
      lg: '0 4px 6px oklch(0% 0 0 / 0.08), 0 2px 4px oklch(0% 0 0 / 0.05)',
      xl: '0 8px 10px oklch(0% 0 0 / 0.1), 0 4px 6px oklch(0% 0 0 / 0.06)',
      '2xl': '0 12px 20px oklch(0% 0 0 / 0.15)',
    },
  },

  // -------------------------------------------------------------------------
  // LIGHT MODE BACKGROUNDS
  // -------------------------------------------------------------------------
  light: {
    bg: {
      primary: 'oklch(99% 0.003 90)',
      secondary: 'oklch(97.5% 0.005 85)',
      tertiary: 'oklch(96% 0.007 80)',
      quaternary: 'oklch(94% 0.008 75)',
      selected: 'oklch(92% 0.025 42)',
      code: 'oklch(98% 0.004 85)',
      overlay: 'oklch(98% 0.003 90 / 0.9)',
    },
    text: {
      primary: 'oklch(18% 0.014 75)',
      secondary: 'oklch(42% 0.012 70)',
      tertiary: 'oklch(44% 0.01 65)',
      disabled: 'oklch(68% 0.008 60)',
      inverse: 'oklch(100% 0 0)',
    },
    border: {
      default: 'oklch(92% 0.006 75)',
      light: 'oklch(95% 0.004 80)',
      medium: 'oklch(88% 0.008 70)',
      strong: 'oklch(70% 0.2 35)',
    },
    shadow: {
      xs: '0 1px 2px oklch(0% 0 0 / 0.03)',
      sm: '0 1px 3px oklch(0% 0 0 / 0.06)',
      md: '0 4px 6px oklch(0% 0 0 / 0.08)',
      lg: '0 10px 15px oklch(0% 0 0 / 0.1)',
      xl: '0 15px 20px oklch(0% 0 0 / 0.12)',
      '2xl': '0 20px 30px oklch(0% 0 0 / 0.18)',
    },
    /** Light mode accent adjustments for better contrast */
    accent: {
      primary: 'oklch(70% 0.2 35)',
      hover: 'oklch(54% 0.17 40)',
      active: 'oklch(50% 0.175 39)',
      subtle: 'oklch(95% 0.035 42)',
    },
  },

  // -------------------------------------------------------------------------
  // SEMANTIC COLORS (theme-aware, use CSS variables in components)
  // -------------------------------------------------------------------------
  semantic: {
    success: {
      dark: {
        text: 'oklch(72% 0.19 145)',
        bg: 'oklch(35% 0.08 145 / 0.15)',
        border: 'oklch(64% 0.19 145 / 0.3)',
      },
      light: {
        text: 'oklch(52% 0.18 145)',
        bg: 'oklch(96% 0.08 145 / 0.2)',
        border: 'oklch(52% 0.18 145 / 0.3)',
      },
    },
    warning: {
      dark: {
        text: 'oklch(75% 0.155 65)',
        bg: 'oklch(45% 0.08 65 / 0.15)',
        border: 'oklch(68% 0.155 65 / 0.3)',
      },
      light: {
        text: 'oklch(58% 0.16 65)',
        bg: 'oklch(97% 0.08 65 / 0.2)',
        border: 'oklch(58% 0.16 65 / 0.3)',
      },
    },
    error: {
      dark: {
        text: 'oklch(70% 0.195 25)',
        bg: 'oklch(40% 0.08 25 / 0.15)',
        border: 'oklch(63% 0.195 25 / 0.3)',
      },
      light: {
        text: 'oklch(53% 0.19 25)',
        bg: 'oklch(97% 0.08 25 / 0.2)',
        border: 'oklch(53% 0.19 25 / 0.3)',
      },
    },
    info: {
      dark: {
        text: 'oklch(78% 0.168 250)',
        bg: 'oklch(40% 0.08 250 / 0.15)',
        border: 'oklch(65% 0.168 250 / 0.3)',
      },
      light: {
        text: 'oklch(54% 0.17 250)',
        bg: 'oklch(97% 0.08 250 / 0.2)',
        border: 'oklch(54% 0.17 250 / 0.3)',
      },
    },
  },

  // -------------------------------------------------------------------------
  // CATEGORY COLORS - Content type identification
  // -------------------------------------------------------------------------
  category: {
    agents: {
      base: 'oklch(64% 0.19 145)',
      bg: 'oklch(64% 0.19 145 / 0.2)',
      border: 'oklch(64% 0.19 145 / 0.3)',
      hover: 'oklch(64% 0.19 145 / 0.6)',
    },
    mcp: {
      base: 'oklch(58% 0.195 305)',
      bg: 'oklch(58% 0.195 305 / 0.2)',
      border: 'oklch(58% 0.195 305 / 0.3)',
      hover: 'oklch(58% 0.195 305 / 0.6)',
    },
    rules: {
      base: 'oklch(58% 0.19 250)',
      bg: 'oklch(58% 0.19 250 / 0.2)',
      border: 'oklch(58% 0.19 250 / 0.3)',
      hover: 'oklch(58% 0.19 250 / 0.6)',
    },
    commands: {
      base: 'oklch(77% 0.2 38)',
      bg: 'oklch(77% 0.2 38 / 0.2)',
      border: 'oklch(77% 0.2 38 / 0.3)',
      hover: 'oklch(77% 0.2 38 / 0.6)',
    },
    hooks: {
      base: 'oklch(65% 0.24 350)',
      bg: 'oklch(65% 0.24 350 / 0.2)',
      border: 'oklch(65% 0.24 350 / 0.3)',
      hover: 'oklch(65% 0.24 350 / 0.6)',
    },
    statuslines: {
      base: 'oklch(60% 0.2 290)',
      bg: 'oklch(60% 0.2 290 / 0.2)',
      border: 'oklch(60% 0.2 290 / 0.3)',
      hover: 'oklch(60% 0.2 290 / 0.6)',
    },
    collections: {
      base: 'oklch(58% 0.19 270)',
      bg: 'oklch(58% 0.19 270 / 0.2)',
      border: 'oklch(58% 0.19 270 / 0.3)',
      hover: 'oklch(58% 0.19 270 / 0.6)',
    },
    guides: {
      base: 'oklch(58% 0.19 280)',
      bg: 'oklch(58% 0.19 280 / 0.2)',
      border: 'oklch(58% 0.19 280 / 0.3)',
      hover: 'oklch(58% 0.19 280 / 0.6)',
    },
    skills: {
      base: 'oklch(65% 0.2 310)',
      bg: 'oklch(65% 0.2 310 / 0.2)',
      border: 'oklch(65% 0.2 310 / 0.3)',
      hover: 'oklch(65% 0.2 310 / 0.6)',
    },
    tutorials: {
      base: 'oklch(64% 0.19 145)',
      bg: 'oklch(64% 0.19 145 / 0.2)',
      border: 'oklch(64% 0.19 145 / 0.3)',
      hover: 'oklch(64% 0.19 145 / 0.6)',
    },
    workflows: {
      base: 'oklch(65% 0.24 350)',
      bg: 'oklch(65% 0.24 350 / 0.2)',
      border: 'oklch(65% 0.24 350 / 0.3)',
      hover: 'oklch(65% 0.24 350 / 0.6)',
    },
    useCases: {
      base: 'oklch(58% 0.19 250)',
      bg: 'oklch(58% 0.19 250 / 0.2)',
      border: 'oklch(58% 0.19 250 / 0.3)',
      hover: 'oklch(58% 0.19 250 / 0.6)',
    },
    troubleshooting: {
      base: 'oklch(63% 0.195 25)',
      bg: 'oklch(63% 0.195 25 / 0.2)',
      border: 'oklch(63% 0.195 25 / 0.3)',
      hover: 'oklch(63% 0.195 25 / 0.6)',
    },
    default: {
      base: 'oklch(60% 0.005 60)',
      bg: 'oklch(60% 0.005 60 / 0.2)',
      border: 'oklch(60% 0.005 60 / 0.3)',
      hover: 'oklch(60% 0.005 60 / 0.6)',
    },
  },

  // -------------------------------------------------------------------------
  // SYNTAX HIGHLIGHTING - Polar-style muted palette
  // -------------------------------------------------------------------------
  syntax: {
    keyword: '#7dd3fc',
    function: '#93c5fd',
    number: '#fcd34d',
    string: '#86efac',
    comment: '#64748b',
  },

  // -------------------------------------------------------------------------
  // BRAND INTEGRATIONS
  // -------------------------------------------------------------------------
  integrations: {
    discord: {
      base: 'oklch(58% 0.185 272)',
      hover: 'oklch(58% 0.185 272 / 0.1)',
      border: 'oklch(58% 0.185 272 / 0.3)',
    },
  },
} as const;

// =============================================================================
// SPACING TOKENS
// =============================================================================

/**
 * Spacing scale based on 4px grid (0.25rem base).
 * Names are semantic rather than numeric for clarity.
 */
export const spacing = {
  /** 2px - Micro spacing for tight elements */
  micro: '0.125rem',
  /** 4px - Tight spacing */
  tight: '0.25rem',
  /** 6px - Between tight and compact */
  snug: '0.375rem',
  /** 8px - Compact spacing */
  compact: '0.5rem',
  /** 10px - Between compact and default */
  cozy: '0.625rem',
  /** 12px - Default spacing */
  default: '0.75rem',
  /** 14px - Between default and comfortable */
  moderate: '0.875rem',
  /** 16px - Comfortable spacing */
  comfortable: '1rem',
  /** 20px - Spacious */
  spacious: '1.25rem',
  /** 24px - Relaxed spacing */
  relaxed: '1.5rem',
  /** 28px - Between relaxed and loose */
  airy: '1.75rem',
  /** 32px - Loose spacing */
  loose: '2rem',
  /** 36px - Very loose */
  generous: '2.25rem',
  /** 40px - Extra spacing */
  extra: '2.5rem',
  /** 48px - Section spacing */
  section: '3rem',
  /** 56px - Large section */
  sectionLarge: '3.5rem',
  /** 64px - Hero spacing */
  hero: '4rem',
  /** 80px - Extra hero */
  heroLarge: '5rem',
  /** 96px - Maximum spacing */
  max: '6rem',
} as const;

/**
 * Tailwind gap class equivalents for spacing tokens.
 * Use these when you need the Tailwind class name.
 */
export const spacingClass = {
  micro: 'gap-0.5',
  tight: 'gap-1',
  snug: 'gap-1.5',
  compact: 'gap-2',
  cozy: 'gap-2.5',
  default: 'gap-3',
  moderate: 'gap-3.5',
  comfortable: 'gap-4',
  spacious: 'gap-5',
  relaxed: 'gap-6',
  airy: 'gap-7',
  loose: 'gap-8',
  generous: 'gap-9',
  extra: 'gap-10',
  section: 'gap-12',
  sectionLarge: 'gap-14',
  hero: 'gap-16',
  heroLarge: 'gap-20',
  max: 'gap-24',
} as const;

// =============================================================================
// TYPOGRAPHY TOKENS
// =============================================================================

export const typography = {
  /** Font family definitions */
  fontFamily: {
    /** Primary sans-serif font stack */
    sans: 'var(--font-inter, "Inter"), system-ui, -apple-system, "Segoe UI", sans-serif',
    /** Monospace font stack for code */
    mono: 'var(--font-geist-mono, "GeistMono"), "SF Mono", Consolas, "Monaco", monospace',
  },

  /** Font size scale */
  fontSize: {
    /** 10px - Micro text */
    '2xs': '0.625rem',
    /** 11px - Very small */
    '3xs': '0.6875rem',
    /** 12px - Extra small */
    xs: '0.75rem',
    /** 14px - Small */
    sm: '0.875rem',
    /** 16px - Base */
    base: '1rem',
    /** 18px - Large */
    lg: '1.125rem',
    /** 20px - Extra large */
    xl: '1.25rem',
    /** 24px - 2XL */
    '2xl': '1.5rem',
    /** 30px - 3XL */
    '3xl': '1.875rem',
    /** 36px - 4XL */
    '4xl': '2.25rem',
    /** 48px - 5XL */
    '5xl': '3rem',
    /** 60px - 6XL */
    '6xl': '3.75rem',
  },

  /** Font weight scale */
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  /** Line height scale */
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  /** Letter spacing scale */
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  /** Pre-composed typography styles */
  presets: {
    /** Hero headline */
    heroHeadline: {
      fontSize: '3rem',
      fontWeight: '700',
      lineHeight: '1.1',
      letterSpacing: '-0.02em',
    },
    /** Page title */
    pageTitle: {
      fontSize: '2.25rem',
      fontWeight: '700',
      lineHeight: '1.25',
      letterSpacing: '-0.02em',
    },
    /** Section heading */
    sectionHeading: {
      fontSize: '1.5rem',
      fontWeight: '600',
      lineHeight: '1.375',
      letterSpacing: '-0.01em',
    },
    /** Card title */
    cardTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      lineHeight: '1.5',
    },
    /** Body text */
    body: {
      fontSize: '1rem',
      fontWeight: '400',
      lineHeight: '1.625',
    },
    /** Small body text */
    bodySmall: {
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.5',
    },
    /** Caption/label text */
    caption: {
      fontSize: '0.75rem',
      fontWeight: '500',
      lineHeight: '1.5',
    },
    /** Code text */
    code: {
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.6',
    },
  },
} as const;

// =============================================================================
// ANIMATION TOKENS
// =============================================================================

export const animation = {
  /** Spring physics configurations for Motion.dev */
  spring: {
    /** Default spring - balanced feel */
    default: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 17,
    },
    /** Bouncy spring - playful feel */
    bouncy: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 20,
    },
    /** Smooth spring - elegant feel */
    smooth: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    },
    /** Snappy spring - quick response */
    snappy: {
      type: 'spring' as const,
      stiffness: 600,
      damping: 30,
    },
  },

  /** Duration values in milliseconds */
  duration: {
    instant: 0,
    fast: 150,
    default: 200,
    slow: 300,
    slower: 500,
    slowest: 700,
  },

  /** CSS duration values */
  durationCss: {
    instant: '0ms',
    fast: '150ms',
    default: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '700ms',
  },

  /** Easing functions */
  easing: {
    /** Linear - no acceleration */
    linear: 'linear',
    /** Ease in - slow start */
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    /** Ease out - slow end */
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    /** Ease in-out - slow start and end */
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    /** Bounce - playful overshoot */
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  /** Easing as arrays for Motion.dev */
  easingArray: {
    linear: [0, 0, 1, 1] as const,
    easeIn: [0.4, 0, 1, 1] as const,
    easeOut: [0, 0, 0.2, 1] as const,
    easeInOut: [0.4, 0, 0.2, 1] as const,
    bounce: [0.68, -0.55, 0.265, 1.55] as const,
  },

  /** Pre-composed animation presets */
  presets: {
    /** Button hover scale */
    buttonHover: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
    /** Card hover lift */
    cardHover: {
      y: -2,
      transition: { type: 'spring', stiffness: 400, damping: 17 },
    },
    /** Fade in animation */
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.2 },
    },
    /** Slide up animation */
    slideUp: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
    },
    /** Scale in animation */
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.2, ease: [0, 0, 0.2, 1] },
    },
  },

  /** Stagger delay values */
  stagger: {
    fast: 0.05,
    default: 0.1,
    slow: 0.15,
  },

  /** Ticker animation speeds */
  ticker: {
    fast: 1000,
    default: 1500,
    slow: 2000,
  },

  /** Border beam animation */
  borderBeam: {
    default: 15000,
  },
} as const;

// =============================================================================
// BORDER TOKENS
// =============================================================================

export const borders = {
  /** Border radius scale */
  radius: {
    none: '0',
    xs: '0.125rem',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  /** Border width scale */
  width: {
    none: '0',
    default: '1px',
    thick: '2px',
    thicker: '3px',
  },
} as const;

// =============================================================================
// SHADOW TOKENS
// =============================================================================

export const shadows = {
  /** Glow effects for accent elements */
  glow: {
    accent: '0 0 20px oklch(74% 0.2 35 / 0.1)',
    accentStrong: '0 0 20px oklch(74% 0.2 35 / 0.3)',
    success: '0 0 0 4px oklch(72% 0.19 145 / 0.15)',
    error: '0 0 0 4px oklch(70% 0.195 25 / 0.15)',
    info: '0 0 0 4px oklch(78% 0.168 250 / 0.15)',
  },
} as const;

// =============================================================================
// BREAKPOINT TOKENS
// =============================================================================

export const breakpoints = {
  /** Extra small - mobile phones */
  xs: 320,
  /** Small - large phones */
  sm: 640,
  /** Medium - tablets */
  md: 768,
  /** Large - small laptops */
  lg: 1024,
  /** Extra large - desktops */
  xl: 1280,
  /** 2XL - large desktops */
  '2xl': 1400,
  /** 3XL - ultra-wide */
  '3xl': 1920,
} as const;

export const breakpointsPx = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px',
  '3xl': '1920px',
} as const;

// =============================================================================
// Z-INDEX TOKENS
// =============================================================================

export const zIndex = {
  /** Base layer */
  base: 0,
  /** Above base - raised elements */
  raised: 10,
  /** Dropdown menus */
  dropdown: 20,
  /** Sticky elements */
  sticky: 30,
  /** Fixed position elements */
  fixed: 40,
  /** Modal backdrop */
  modalBackdrop: 50,
  /** Modal content */
  modal: 60,
  /** Popovers */
  popover: 70,
  /** Tooltips */
  tooltip: 80,
  /** Toast notifications */
  toast: 90,
  /** Maximum z-index */
  max: 100,
} as const;

// =============================================================================
// LAYOUT TOKENS
// =============================================================================

export const layout = {
  /** Container max widths */
  container: {
    xs: '20rem',
    sm: '24rem',
    md: '28rem',
    lg: '32rem',
    xl: '36rem',
    '2xl': '42rem',
    '3xl': '48rem',
    '4xl': '56rem',
    '5xl': '64rem',
    '6xl': '72rem',
    '7xl': '80rem',
    full: '100%',
  },

  /** Navigation heights */
  nav: {
    mobile: '3.5rem',
    desktop: '4rem',
    scrolledMobile: '2.75rem',
    scrolledDesktop: '3rem',
  },

  /** Sidebar widths */
  sidebar: {
    sm: '17.5rem',
    md: '20rem',
    lg: '23.75rem',
  },

  /** Content max widths */
  content: {
    prose: '65ch',
    article: '42rem',
    form: '45rem',
  },
} as const;

// =============================================================================
// OPACITY TOKENS
// =============================================================================

export const opacity = {
  /** Invisible */
  0: '0',
  /** Very subtle */
  5: '0.05',
  /** Subtle */
  10: '0.1',
  /** Light */
  20: '0.2',
  /** Medium-light */
  30: '0.3',
  /** Medium */
  50: '0.5',
  /** Medium-strong */
  70: '0.7',
  /** Strong */
  80: '0.8',
  /** Very strong */
  90: '0.9',
  /** Opaque */
  100: '1',
} as const;

// =============================================================================
// COMBINED TOKENS EXPORT
// =============================================================================

/**
 * All design tokens as a single object.
 * Use this for full access or destructure what you need:
 *
 * @example
 * import { tokens } from '@heyclaude/web-runtime/design-system';
 * const { colors, spacing, animation } = tokens;
 */
export const tokens = {
  colors,
  spacing,
  spacingClass,
  typography,
  animation,
  borders,
  shadows,
  breakpoints,
  breakpointsPx,
  zIndex,
  layout,
  opacity,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ColorTokens = typeof colors;
export type SpacingTokens = typeof spacing;
export type SpacingClassTokens = typeof spacingClass;
export type TypographyTokens = typeof typography;
export type AnimationTokens = typeof animation;
export type BorderTokens = typeof borders;
export type ShadowTokens = typeof shadows;
export type BreakpointTokens = typeof breakpoints;
export type ZIndexTokens = typeof zIndex;
export type LayoutTokens = typeof layout;
export type OpacityTokens = typeof opacity;
export type DesignTokens = typeof tokens;

// Specific key types for autocomplete
export type SpacingKey = keyof typeof spacing;
export type FontSizeKey = keyof typeof typography.fontSize;
export type FontWeightKey = keyof typeof typography.fontWeight;
export type BorderRadiusKey = keyof typeof borders.radius;
export type BreakpointKey = keyof typeof breakpoints;
export type ZIndexKey = keyof typeof zIndex;
export type CategoryKey = keyof typeof colors.category;
