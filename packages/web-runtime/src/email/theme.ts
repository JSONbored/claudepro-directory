/**
 * Email Theme Constants
 * Email-safe RGB colors converted from OKLCH design system
 *
 * Note: Email clients don't support OKLCH, so colors are converted to RGB
 * All colors tested across major email clients (Gmail, Outlook, Apple Mail)
 *
 * Source: apps/web/src/app/globals.css
 * Conversion utility: packages/web-runtime/src/email/utils/oklch-to-rgb.ts
 */

/**
 * Dark theme colors (default for emails)
 * Based on Claude Desktop dark theme from globals.css
 * All colors converted from OKLCH to RGB for email client compatibility
 */
export const darkTheme = {
  // Backgrounds – Claude desktop palette
  // Source: globals.css dark theme backgrounds
  bgPrimary: '#221E1C', // oklch(24% 0.008 60)
  bgSecondary: '#2B2826', // oklch(28% 0.006 60) - card background
  bgTertiary: '#36322F', // oklch(32% 0.008 60)
  bgQuaternary: '#413C38', // oklch(36% 0.009 60)
  bgSelected: '#4C4742', // oklch(40% 0.01 60)
  bgCode: '#060605', // oklch(12% 0.003 60)
  bgOverlay: 'rgba(20, 17, 17, 0.8)', // oklch(18% 0.005 0 / 0.8)

  // Text colors
  // Source: globals.css dark theme text colors
  textPrimary: '#F1EEEB', // oklch(95% 0.005 60) - foreground
  textSecondary: '#BBB6B2', // oklch(78% 0.008 60) - muted-foreground
  textTertiary: '#A9A39E', // oklch(72% 0.01 60) - color-text-tertiary
  textDisabled: '#7D7670', // oklch(57% 0.012 60) - color-text-disabled
  textInverse: '#FFFFFF', // oklch(100% 0 0) - color-text-inverse

  // Borders
  // Source: globals.css dark theme borders
  borderDefault: 'rgba(48, 45, 43, 0.5)', // oklch(30% 0.005 60 / 0.5) - border
  borderLight: 'rgba(43, 40, 38, 0.3)', // oklch(28% 0.005 60 / 0.3) - color-border-light
  borderMedium: 'rgba(59, 55, 52, 0.6)', // oklch(34% 0.008 60 / 0.6) - color-border-medium
  borderStrong: '#FF714A', // oklch(74% 0.2 35) - Claude orange (color-border-strong)
} as const;

/**
 * Light theme colors
 * Based on Claude Desktop light theme from globals.css
 * All colors converted from OKLCH to RGB for email client compatibility
 */
export const lightTheme = {
  // Backgrounds
  // Source: globals.css light theme backgrounds
  bgPrimary: '#FCFCF9', // oklch(99% 0.003 90) - background
  bgSecondary: '#F8F7F3', // oklch(97.5% 0.005 85) - card background
  bgTertiary: '#F4F1ED', // oklch(96% 0.007 80) - color-bg-tertiary
  bgQuaternary: '#EEEAE5', // oklch(94% 0.008 75) - color-bg-quaternary
  bgSelected: '#F4E0D8', // oklch(92% 0.025 42) - color-bg-selected (orange tinted)
  bgCode: '#FAF8F5', // oklch(98% 0.004 85) - color-bg-code
  bgOverlay: 'rgba(249, 248, 246, 0.9)', // oklch(98% 0.003 90 / 0.9) - color-bg-overlay

  // Text colors
  // Source: globals.css light theme text colors
  textPrimary: '#0D0B09', // oklch(15% 0.005 60) - foreground
  textSecondary: '#514C46', // oklch(42% 0.012 70) - muted-foreground
  textTertiary: '#57514D', // oklch(44% 0.01 65) - color-text-tertiary
  textDisabled: '#9C9793', // oklch(68% 0.008 60) - color-text-disabled
  textInverse: '#FFFFFF', // oklch(100% 0 0) - color-text-inverse

  // Borders
  // Source: globals.css light theme borders
  borderDefault: '#E7E4E0', // oklch(92% 0.006 75) - border
  borderLight: '#F0EEEB', // oklch(95% 0.004 80) - color-border-light
  borderMedium: '#DBD7D2', // oklch(88% 0.008 70) - color-border-medium
  borderStrong: '#FF714A', // oklch(74% 0.2 35) - Claude orange (same as dark theme)
} as const;

/**
 * Claude brand colors (work in both themes)
 * These are the core brand colors used across all emails
 * Source: globals.css brand colors
 */
export const brandColors = {
  // Claude Orange - Primary brand color
  // Source: globals.css --claude-orange variants
  primary: '#FF714A', // oklch(74% 0.2 35) - --claude-orange
  primaryHover: '#FF835D', // oklch(78% 0.19 35) - --claude-orange-hover
  primaryActive: '#FF5F35', // oklch(70% 0.21 35) - --claude-orange-active
  primaryLight: '#FF9871', // oklch(82% 0.17 37) - --claude-orange-light
  primaryMuted: '#E85B40', // oklch(65% 0.18 33) - --claude-orange-muted

  // Semantic colors - Dark theme (default for emails)
  // Source: globals.css dark theme semantic colors
  success: '#43C251', // oklch(72% 0.19 145) - --color-success (dark)
  warning: '#F0962B', // oklch(75% 0.155 65) - --color-warning (dark)
  error: '#FF615D', // oklch(70% 0.195 25) - --color-error (dark)
  info: '#57BDFF', // oklch(78% 0.168 250) - --color-info (dark)

  // Semantic colors - Light theme (for reference, use dark as default)
  // Source: globals.css light theme semantic colors
  successLight: '#00810E', // oklch(52% 0.18 145) - --color-success (light)
  warningLight: '#B86000', // oklch(58% 0.16 65) - --color-warning (light)
  errorLight: '#C2272D', // oklch(53% 0.19 25) - --color-error (light)
  infoLight: '#0070CC', // oklch(54% 0.17 250) - --color-info (light)
} as const;

/**
 * Gradient & texture tokens for emails
 * Note: Gradients have limited support in email clients, use sparingly
 * Source: globals.css gradient definitions
 */
export const gradients = {
  // Dark theme hero gradient (using converted colors)
  hero: `linear-gradient(150deg, ${darkTheme.bgCode} 0%, ${darkTheme.bgPrimary} 45%, ${darkTheme.bgQuaternary} 100%)`,
  // Brand orange highlight gradient
  heroHighlight: `linear-gradient(118deg, ${brandColors.primaryLight} 0%, ${brandColors.primary} 55%, ${brandColors.primaryHover} 100%)`,
  // Subtle surface gradient
  surface: `linear-gradient(160deg, rgba(241,238,235,0.03), rgba(241,238,235,0))`,
  // Border glow effect
  borderGlow: `linear-gradient(120deg, rgba(255,113,74,0.4), rgba(255,113,74,0))`,
} as const;

/**
 * Email-safe spacing scale
 * Based on 8px grid system
 */
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

/**
 * Email-safe typography scale
 * System fonts for maximum compatibility
 */
export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

/**
 * Email-safe border radius
 */
export const borderRadius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

/**
 * Email-safe shadows
 * Note: Some email clients strip box-shadow, use sparingly
 */
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
} as const;

/**
 * Default theme for emails (dark theme)
 * Most readable across email clients
 */
export const emailTheme = darkTheme;

/**
 * Type exports for TypeScript autocomplete
 */
export type EmailTheme = typeof emailTheme;
export type BrandColors = typeof brandColors;
export type Spacing = typeof spacing;
export type Typography = typeof typography;
