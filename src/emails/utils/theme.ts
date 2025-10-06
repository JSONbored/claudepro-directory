/**
 * Email Theme Constants
 * Email-safe RGB colors converted from OKLCH design system
 *
 * Note: Email clients don't support OKLCH, so colors are converted to RGB
 * All colors tested across major email clients (Gmail, Outlook, Apple Mail)
 */

/**
 * Dark theme colors (default for emails)
 * Based on Claude Desktop dark theme
 */
export const darkTheme = {
  // Backgrounds
  bgPrimary: '#3a3a3c', // oklch(24% 0.008 60) converted
  bgSecondary: '#48484a', // oklch(28% 0.006 60) converted
  bgTertiary: '#555557', // oklch(32% 0.008 60) converted
  bgQuaternary: '#636366', // oklch(36% 0.009 60) converted
  bgSelected: '#707075', // oklch(40% 0.01 60) converted
  bgCode: '#2c2c2e', // oklch(20% 0.005 60) converted
  bgOverlay: 'rgba(28, 28, 30, 0.8)', // oklch(18% 0.005 0 / 0.8) converted

  // Text
  textPrimary: '#f0f0f2', // oklch(94% 0.005 60) converted
  textSecondary: '#c7c7cc', // oklch(78% 0.008 60) converted
  textTertiary: '#9c9ca1', // oklch(62% 0.01 60) converted
  textDisabled: '#6e6e73', // oklch(48% 0.012 60) converted
  textInverse: '#fafafa', // oklch(98% 0.003 90) converted

  // Borders
  borderDefault: 'rgba(76, 76, 79, 0.5)', // oklch(30% 0.005 60 / 0.5) converted
  borderLight: 'rgba(71, 71, 74, 0.3)', // oklch(28% 0.005 60 / 0.3) converted
  borderMedium: 'rgba(87, 87, 90, 0.6)', // oklch(34% 0.008 60 / 0.6) converted
  borderStrong: '#ff6b35', // Claude orange - oklch(62% 0.155 42) converted
} as const;

/**
 * Light theme colors
 * Based on Claude Desktop light theme
 */
export const lightTheme = {
  // Backgrounds
  bgPrimary: '#fcfcfd', // oklch(99% 0.003 90) converted
  bgSecondary: '#f8f8fa', // oklch(97.5% 0.005 85) converted
  bgTertiary: '#f3f3f6', // oklch(96% 0.007 80) converted
  bgQuaternary: '#ededf0', // oklch(94% 0.008 75) converted
  bgSelected: '#ffd4b3', // oklch(92% 0.025 42) converted - orange tinted
  bgCode: '#fafbfc', // oklch(98% 0.004 85) converted
  bgOverlay: 'rgba(250, 250, 253, 0.9)', // oklch(98% 0.003 90 / 0.9) converted

  // Text
  textPrimary: '#2c2c34', // oklch(18% 0.014 75) converted
  textSecondary: '#6a6a75', // oklch(42% 0.012 70) converted
  textTertiary: '#939399', // oklch(58% 0.01 65) converted
  textDisabled: '#afafb3', // oklch(68% 0.008 60) converted
  textInverse: '#fafafa', // oklch(98% 0.003 90) converted

  // Borders
  borderDefault: '#e8e8eb', // oklch(92% 0.006 75) converted
  borderLight: '#f2f2f5', // oklch(95% 0.004 80) converted
  borderMedium: '#dcdce0', // oklch(88% 0.008 70) converted
  borderStrong: '#e8733d', // Claude orange light - oklch(58% 0.165 41) converted
} as const;

/**
 * Claude brand colors (work in both themes)
 * These are the core brand colors used across all emails
 */
export const brandColors = {
  // Claude Orange - Primary brand color
  primary: '#ff6b35', // oklch(62% 0.155 42) converted
  primaryHover: '#ff7d4d', // oklch(66% 0.145 42) converted
  primaryActive: '#f35829', // oklch(57% 0.16 42) converted
  primaryLight: '#ff9366', // oklch(70% 0.135 45) converted
  primaryMuted: '#d65a2b', // oklch(48% 0.142 37) converted

  // Semantic colors
  success: '#34c759', // Green for success states
  warning: '#ff9500', // Orange for warnings
  error: '#ff3b30', // Red for errors
  info: '#007aff', // Blue for information
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
