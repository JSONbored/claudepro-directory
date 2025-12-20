/**
 * Shiki Theme Configuration
 *
 * Centralized theme management for code highlighting.
 * Change themes in ONE place to update all code blocks across the application.
 *
 * Popular theme options:
 * - 'github-light' / 'github-dark' - GitHub's theme (clean, readable)
 * - 'vitesse-light' / 'vitesse-dark' - Modern, high contrast (used by Vite, Vue)
 * - 'nord' - Beautiful blue-based dark theme
 * - 'min-light' / 'min-dark' - Minimal, clean themes
 * - 'dark-plus' / 'light-plus' - VS Code default themes
 * - 'one-dark-pro' - Popular VS Code theme
 * - 'dracula' - Popular dark theme
 * - 'material-theme' - Google Material Design theme
 *
 * Next.js docs typically use: vitesse-light / vitesse-dark or custom themes
 * Supabase docs typically use: vitesse-light / vitesse-dark or nord
 *
 * To change themes globally, update the THEME_CONFIG object below.
 *
 * @module shared-runtime/code-highlight-themes
 */

/**
 * Theme Configuration
 *
 * Single source of truth for all code highlighting themes.
 * Change these values to switch themes across the entire application.
 *
 * Recommended themes matching Next.js/Supabase style:
 * - vitesse-light / vitesse-dark (current) - Modern, high contrast, used by Vite/Vue
 * - github-light / github-dark - Clean, readable, used by GitHub
 * - github-light / nord - Beautiful blue-based dark (Supabase style)
 *
 * To change themes globally, simply update the values below.
 */
export const THEME_CONFIG = {
  /**
   * Light theme name
   * Popular options: 'github-light', 'vitesse-light', 'min-light', 'light-plus'
   *
   * Next.js docs: Typically use 'vitesse-light'
   * Supabase docs: Typically use 'vitesse-light' or 'github-light'
   */
  light: 'vitesse-light' as const,

  /**
   * Dark theme name
   * Popular options: 'github-dark', 'vitesse-dark', 'nord', 'dark-plus', 'one-dark-pro'
   *
   * Next.js docs: Typically use 'vitesse-dark'
   * Supabase docs: Typically use 'vitesse-dark' or 'nord' (beautiful blue-based)
   */
  dark: 'vitesse-dark' as const,
} as const;

/**
 * Theme names type for type safety
 */
export type ThemeName = typeof THEME_CONFIG.light | typeof THEME_CONFIG.dark | string;

/**
 * Get theme configuration for Shiki
 *
 * @returns Theme configuration object with light and dark theme names
 *
 * @example
 * ```ts
 * const themes = getThemeConfig();
 * // { light: 'vitesse-light', dark: 'vitesse-dark' }
 * ```
 */
export function getThemeConfig(): { light: string; dark: string } {
  return {
    light: THEME_CONFIG.light,
    dark: THEME_CONFIG.dark,
  };
}

/**
 * Available Shiki Themes (as of Dec 2025)
 *
 * This is a reference list of popular themes available in Shiki.
 * All themes are bundled with Shiki and can be used by name.
 *
 * Light Themes:
 * - github-light - GitHub's light theme (clean, readable)
 * - vitesse-light - Modern, high contrast (Vite/Vue style)
 * - min-light - Minimal, clean light theme
 * - light-plus - VS Code default light theme
 * - solarized-light - Solarized light theme
 * - catppuccin-latte - Catppuccin latte theme
 *
 * Dark Themes:
 * - github-dark - GitHub's dark theme
 * - vitesse-dark - Modern, high contrast dark (Vite/Vue style) - RECOMMENDED
 * - nord - Beautiful blue-based dark theme - RECOMMENDED
 * - dark-plus - VS Code default dark theme
 * - one-dark-pro - Popular VS Code theme
 * - dracula - Popular dark theme
 * - material-theme - Google Material Design dark theme
 * - monokai - Classic Monokai theme
 * - solarized-dark - Solarized dark theme
 * - catppuccin-mocha - Catppuccin mocha theme
 * - tokyo-night - Tokyo Night theme
 * - gruvbox-dark - Gruvbox dark theme
 *
 * Resources:
 * - View all themes: https://github.com/shikijs/shiki/blob/main/docs/themes.md
 * - Theme preview: https://shiki.matsu.io/themes
 * - Theme source: https://github.com/shikijs/textmate-grammars-themes/tree/main/packages/tm-themes/themes
 */
export const AVAILABLE_THEMES = {
  light: [
    'github-light',
    'vitesse-light',
    'min-light',
    'light-plus',
    'solarized-light',
    'catppuccin-latte',
  ],
  dark: [
    'github-dark',
    'vitesse-dark',
    'nord',
    'dark-plus',
    'one-dark-pro',
    'dracula',
    'material-theme',
    'monokai',
    'solarized-dark',
    'catppuccin-mocha',
    'tokyo-night',
    'gruvbox-dark',
  ],
} as const;

/**
 * Recommended theme combinations
 *
 * These are popular, well-tested theme pairs that work well together.
 */
export const RECOMMENDED_THEMES = {
  /**
   * Vitesse (Vite/Vue style) - Modern, high contrast
   * Used by: Vite, Vue, many modern docs
   */
  vitesse: {
    light: 'vitesse-light',
    dark: 'vitesse-dark',
  },

  /**
   * GitHub - Clean, readable, familiar
   * Used by: GitHub, many open source projects
   */
  github: {
    light: 'github-light',
    dark: 'github-dark',
  },

  /**
   * Nord - Beautiful blue-based dark theme
   * Used by: Supabase docs, many developers
   */
  nord: {
    light: 'github-light', // Nord doesn't have a light theme, use GitHub light
    dark: 'nord',
  },

  /**
   * VS Code - Familiar to developers
   */
  vscode: {
    light: 'light-plus',
    dark: 'dark-plus',
  },

  /**
   * Minimal - Clean, minimal design
   */
  minimal: {
    light: 'min-light',
    dark: 'min-dark',
  },
} as const;
