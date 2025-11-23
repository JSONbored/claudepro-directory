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
  // Backgrounds – Claude desktop palette
  bgPrimary: '#22231E',
  bgSecondary: '#2B2B28',
  bgTertiary: '#1B1B18',
  bgQuaternary: '#2F2F2B',
  bgSelected: '#3A3A34',
  bgCode: '#2B2B28',
  bgOverlay: 'rgba(34, 35, 30, 0.9)',

  // Text
  textPrimary: '#E9EBE6',
  textSecondary: '#C2C5BD',
  textTertiary: '#8F928A',
  textDisabled: '#5E6059',
  textInverse: '#1A1B17',

  // Borders
  borderDefault: 'rgba(233, 235, 230, 0.08)',
  borderLight: 'rgba(233, 235, 230, 0.14)',
  borderMedium: 'rgba(233, 235, 230, 0.24)',
  borderStrong: '#FF6F4A',
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
  primary: '#FF6F4A',
  primaryHover: '#FF825F',
  primaryActive: '#F15A36',
  primaryLight: '#FF9B76',
  primaryMuted: '#D65A2B',

  // Semantic colors
  success: '#34c759', // Green for success states
  warning: '#ff9500', // Orange for warnings
  error: '#ff3b30', // Red for errors
  info: '#007aff', // Blue for information
} as const;

/**
 * Gradient & texture tokens for emails
 */
export const gradients = {
  hero: 'linear-gradient(150deg, #1A1B17 0%, #262621 45%, #2F2F2B 100%)',
  heroHighlight: 'linear-gradient(118deg, #FFB595 0%, #FF6F4A 55%, #FF8A65 100%)',
  surface: 'linear-gradient(160deg, rgba(233,235,230,0.03), rgba(233,235,230,0))',
  borderGlow: 'linear-gradient(120deg, rgba(255,111,74,0.4), rgba(255,111,74,0))',
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
