/**
 * Security Validators - Storybook Mock
 *
 * Browser-compatible mock that doesn't import cache.server.ts or Node.js modules.
 * Provides passthrough implementations of validation functions.
 *
 * **Architecture**: This file is ONLY used in Storybook via Webpack/Vite alias.
 * Production uses the real validators.ts with full validation logic.
 */

// Passthrough implementations - no actual validation in Storybook
export const transforms = {
  sanitize: (input: string) => input,
  validate: (input: string) => input,
  escape: (input: string) => input,
};

export const validators = {
  isValidSlug: (_slug: string) => true,
  isValidCategory: (_category: string) => true,
  isValidEmail: (_email: string) => true,
};

export default {
  transforms,
  validators,
};
