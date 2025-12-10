/**
 * Submission Form Design Tokens
 *
 * Design system tokens specifically for the enhanced submission form.
 * Matches Claude Desktop aesthetic (coffee/warm brown theme).
 *
 * Architecture:
 * - Part of the comprehensive design-tokens system
 * - Uses OKLCH color space for consistency
 * - Self-contained semantic values
 * - Type-safe with const assertions
 *
 * Usage:
 * ```tsx
 * import { SUBMISSION_FORM_TOKENS } from '@heyclaude/web-runtime/design-tokens';
 *
 * <div style={{ backgroundColor: SUBMISSION_FORM_TOKENS.colors.background.primary }}>
 * ```
 *
 * @module web-runtime/design-tokens/submission-form
 */

export const SUBMISSION_FORM_TOKENS = {
  // ==========================================
  // COLORS - Claude Desktop Warm Theme
  // ==========================================
  colors: {
    // Base backgrounds (warm brown/coffee)
    background: {
      primary: 'oklch(24% 0.008 60)', // #2B2520 (coffee brown)
      secondary: 'oklch(28% 0.006 60)', // #372F2A (lighter brown)
      tertiary: 'oklch(32% 0.008 60)', // Even lighter
      elevated: 'oklch(36% 0.009 60)', // Hover/active states
      overlay: 'oklch(18% 0.005 0 / 0.8)', // Modal backdrop
      code: 'oklch(12% 0.003 60)', // Code blocks
    },

    // Text hierarchy
    text: {
      primary: 'oklch(94% 0.005 60)', // #F5F5F7 (off-white)
      secondary: 'oklch(78% 0.008 60)', // #C7C7CC (gray)
      tertiary: 'oklch(72% 0.01 60)', // Muted
      disabled: 'oklch(57% 0.012 60)', // Very muted
      inverse: '#FFFFFF', // Pure white
      placeholder: 'oklch(57% 0.012 60)', // Same as disabled
    },

    // Brand accent (Claude orange)
    accent: {
      primary: 'oklch(74% 0.2 35)', // #F97316 (logo orange)
      hover: 'oklch(78% 0.19 35)', // Lighter orange
      active: 'oklch(70% 0.21 35)', // Darker orange
      light: 'oklch(82% 0.17 37)', // Very light
      muted: 'oklch(65% 0.18 33)', // Subtle orange
      glow: 'oklch(74% 0.2 35 / 0.15)', // Orange glow effect
      subtle: 'oklch(45% 0.08 35)', // Very subtle
    },

    // Borders
    border: {
      default: 'oklch(30% 0.005 60 / 0.5)', // Subtle
      light: 'oklch(28% 0.005 60 / 0.3)', // Very subtle
      medium: 'oklch(34% 0.008 60 / 0.6)', // More visible
      strong: 'oklch(74% 0.2 35)', // Orange border
      focus: 'oklch(74% 0.2 35 / 0.4)', // Orange focus ring
    },

    // Semantic states
    success: {
      text: 'oklch(72% 0.19 145)', // Green
      bg: 'oklch(35% 0.08 145 / 0.15)', // Green background
      border: 'oklch(64% 0.19 145 / 0.3)', // Green border
      glow: 'oklch(72% 0.19 145 / 0.15)', // Green glow
    },
    error: {
      text: 'oklch(70% 0.195 25)', // Red
      bg: 'oklch(40% 0.08 25 / 0.15)', // Red background
      border: 'oklch(63% 0.195 25 / 0.3)', // Red border
      glow: 'oklch(70% 0.195 25 / 0.15)', // Red glow
    },
    warning: {
      text: 'oklch(75% 0.155 65)', // Yellow
      bg: 'oklch(45% 0.08 65 / 0.15)', // Yellow background
      border: 'oklch(68% 0.155 65 / 0.3)', // Yellow border
      glow: 'oklch(75% 0.155 65 / 0.15)', // Yellow glow
    },
    info: {
      text: 'oklch(78% 0.168 250)', // Blue
      bg: 'oklch(40% 0.08 250 / 0.15)', // Blue background
      border: 'oklch(65% 0.168 250 / 0.3)', // Blue border
      glow: 'oklch(78% 0.168 250 / 0.15)', // Blue glow
    },

    // Category colors (for type selection)
    category: {
      agents: 'oklch(64% 0.19 145)', // Green
      mcp: 'oklch(58% 0.195 305)', // Purple
      rules: 'oklch(58% 0.19 250)', // Blue
      commands: 'oklch(77% 0.2 38)', // Orange
      hooks: 'oklch(65% 0.24 350)', // Pink
      statuslines: 'oklch(60% 0.2 290)', // Purple-ish
      skills: 'oklch(65% 0.2 310)', // Violet
    },

    // Field states
    field: {
      idle: 'oklch(26% 0.006 60)', // Default field bg
      hover: 'oklch(28% 0.008 60)', // Hover state
      focus: 'oklch(28% 0.008 60)', // Focus state
      filled: 'oklch(24% 0.008 60)', // Field with content
      disabled: 'oklch(24% 0.005 60)', // Disabled state
      error: 'oklch(26% 0.006 60)', // Error field (bg stays same)
    },
  },

  // ==========================================
  // SPACING - Matching UI_CLASSES scale
  // ==========================================
  spacing: {
    micro: '2px', // 0.5 in Tailwind
    tight: '4px', // 1
    compact: '8px', // 2
    default: '12px', // 3
    comfortable: '16px', // 4
    relaxed: '24px', // 6
    loose: '32px', // 8
    section: '48px', // 12
    hero: '64px', // 16
  },

  // Field-specific spacing
  field: {
    gap: '12px', // Between label and input
    marginBottom: '24px', // Between fields
    padding: '12px 16px', // Internal field padding
  },

  // Section spacing
  section: {
    gap: '32px', // Between sections
    padding: '32px', // Section internal padding
    marginBottom: '24px', // Between collapsed sections
  },

  // ==========================================
  // TYPOGRAPHY - Inter font family
  // ==========================================
  typography: {
    fontFamily: {
      sans: 'var(--font-inter, Inter), system-ui, sans-serif',
      mono: 'var(--font-geist-mono, GeistMono), monospace',
    },

    // Field typography
    field: {
      label: {
        size: '14px',
        weight: 500,
        leading: '20px',
        tracking: '0.01em',
      },
      input: {
        size: '16px', // iOS minimum to prevent zoom
        weight: 400,
        leading: '24px',
        tracking: '0',
      },
      helpText: {
        size: '13px',
        weight: 400,
        leading: '18px',
        tracking: '0',
      },
      error: {
        size: '13px',
        weight: 500,
        leading: '18px',
      },
    },

    // Section typography
    section: {
      title: {
        size: '20px',
        weight: 600,
        leading: '28px',
        tracking: '-0.01em',
      },
      description: {
        size: '14px',
        weight: 400,
        leading: '20px',
      },
      badge: {
        size: '12px',
        weight: 600,
        leading: '16px',
      },
    },

    // Step typography (larger for emphasis)
    step: {
      title: {
        size: '32px',
        weight: 700,
        leading: '40px',
        tracking: '-0.02em',
      },
      subtitle: {
        size: '16px',
        weight: 400,
        leading: '24px',
      },
      number: {
        size: '14px',
        weight: 700,
        leading: '20px',
      },
    },
  },

  // ==========================================
  // BORDERS & RADIUS
  // ==========================================
  borders: {
    radius: {
      sm: '6px', // Small elements
      md: '8px', // Fields, buttons
      lg: '12px', // Cards
      xl: '16px', // Sections
      '2xl': '20px', // Hero elements
      full: '9999px', // Pills, badges
    },
    width: {
      default: '1px',
      focus: '2px',
      error: '2px',
      thick: '3px',
    },
  },

  // ==========================================
  // SHADOWS - Very subtle for dark theme
  // ==========================================
  shadows: {
    xs: '0 1px 2px oklch(0% 0 0 / 0.02)',
    sm: '0 1px 2px oklch(0% 0 0 / 0.04)',
    md: '0 2px 4px oklch(0% 0 0 / 0.06), 0 1px 2px oklch(0% 0 0 / 0.04)',
    lg: '0 4px 6px oklch(0% 0 0 / 0.08), 0 2px 4px oklch(0% 0 0 / 0.05)',
    xl: '0 8px 10px oklch(0% 0 0 / 0.1), 0 4px 6px oklch(0% 0 0 / 0.06)',
    '2xl': '0 12px 20px oklch(0% 0 0 / 0.15)',

    // Glow effects (colored)
    glow: {
      orange: '0 0 0 4px oklch(74% 0.2 35 / 0.15)',
      green: '0 0 0 4px oklch(72% 0.19 145 / 0.15)',
      red: '0 0 0 4px oklch(70% 0.195 25 / 0.15)',
      blue: '0 0 0 4px oklch(78% 0.168 250 / 0.15)',
      soft: '0 8px 32px -4px oklch(60% 0.2 280 / 0.15)',
      medium: '0 12px 48px -8px oklch(60% 0.2 280 / 0.25)',
    },
  },

  // ==========================================
  // ANIMATIONS - Motion.dev spring configs
  // ==========================================
  animations: {
    spring: {
      default: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 25,
      },
      snappy: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 17,
      },
      bouncy: {
        type: 'spring' as const,
        stiffness: 500,
        damping: 15,
      },
      smooth: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 30,
      },
    },
    duration: {
      fast: 0.15,
      default: 0.25,
      slow: 0.4,
    },
    easing: {
      default: [0.4, 0, 0.2, 1], // ease-out
      emphasized: [0.2, 0, 0, 1], // emphasized ease
      linear: [0, 0, 1, 1], // linear
    },
  },

  // ==========================================
  // LAYOUT CONSTRAINTS
  // ==========================================
  layout: {
    maxWidth: {
      form: '720px', // Comfortable single column
      section: '640px', // Narrower for focused content
      field: '100%', // Full width within container
      typeCard: '180px', // Type selection cards
    },
    minHeight: {
      field: '44px', // iOS recommended touch target
      button: '44px', // Same as field
      section: '60px', // Collapsed section minimum
    },
    gap: {
      fields: '16px', // Between form fields
      sections: '24px', // Between form sections
      cards: '16px', // Between type cards
    },
  },

  // ==========================================
  // BREAKPOINTS - Mobile-first
  // ==========================================
  breakpoints: {
    mobile: '640px', // sm
    tablet: '768px', // md
    desktop: '1024px', // lg
    wide: '1280px', // xl
  },

  // ==========================================
  // Z-INDEX LAYERS
  // ==========================================
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
  },

  // ==========================================
  // TRANSITIONS
  // ==========================================
  transitions: {
    fast: 'all 0.15s ease-out',
    default: 'all 0.25s ease-out',
    slow: 'all 0.4s ease-out',
    colors: 'color 0.2s ease-out, background-color 0.2s ease-out, border-color 0.2s ease-out',
    transform: 'transform 0.3s ease-out',
  },
} as const;

/**
 * Type helper to ensure tokens are used correctly
 */
export type SubmissionFormTokens = typeof SUBMISSION_FORM_TOKENS;
