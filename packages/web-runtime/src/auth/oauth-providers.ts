/**
 * OAuth Provider Validation Utilities
 * Shared validation logic for OAuth provider routes
 */

export const VALID_PROVIDERS = ['github', 'google', 'discord'] as const;
export type ValidProvider = (typeof VALID_PROVIDERS)[number];

/**
 * Type guard to validate if a string is a valid OAuth provider
 * @param provider - The provider string to validate
 * @returns True if provider is valid, false otherwise
 */
export function isValidProvider(provider: string): provider is ValidProvider {
  return VALID_PROVIDERS.includes(provider as ValidProvider);
}
