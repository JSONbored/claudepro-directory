/**
 * Synchronous Validators - Client-Safe
 *
 * Pure synchronous validation and sanitization functions for client components.
 * NO server dependencies, NO batch.utils, NO cache.server imports.
 *
 * **Architecture:**
 * - All functions are pure, synchronous, and browser-compatible
 * - Zero Node.js dependencies (no node:*, no Redis, no filesystem)
 * - Safe to import in 'use client' components
 * - Safe for Storybook
 *
 * **Usage:**
 * ```typescript
 * import { sanitizers, transforms } from '@/src/lib/security/validators-sync';
 * const clean = sanitizers.sanitizeSearchQuerySync(userInput);
 * ```
 *
 * **Related Files:**
 * - validators.ts: Full async validators with server dependencies (use in server components)
 * - validators.mock.ts: Storybook mock (passthrough implementations)
 *
 * @module lib/security/validators-sync
 */

/**
 * Synchronous transforms for client-side use
 * All functions are pure, side-effect-free, and browser-compatible
 */
export const transforms = {
  /**
   * Sanitize string input - remove control characters for security
   * Pure regex-based implementation, no external dependencies
   */
  sanitizeString: (value: string): string => {
    // biome-ignore lint/suspicious/noControlCharactersInRegex: Security validation requires control character removal
    return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  },

  /**
   * Normalize slug to lowercase alphanumeric with hyphens
   * Used for URL-safe identifiers
   */
  normalizeSlug: (value: string): string =>
    value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''),

  /**
   * Sanitize search query for safe display and processing
   * Removes HTML special characters and limits length
   */
  sanitizeSearch: (value: string): string =>
    value
      .trim()
      .replace(/[<>'"&]/g, '')
      .substring(0, 200),

  /**
   * Parse positive integer with fallback to 0
   * Safe for user input parsing
   */
  positiveInt: (value: string | number): number => {
    const num = typeof value === 'string' ? Number.parseInt(value, 10) : value;
    return Number.isNaN(num) || num < 0 ? 0 : num;
  },
} as const;

/**
 * Synchronous sanitizers for client-side use
 * Focused on XSS prevention and input cleaning
 */
export const sanitizers = {
  /**
   * Sanitize search queries to prevent XSS attacks (client-side sync version)
   * Uses regex-based sanitization for fast, browser-compatible operation
   *
   * **Security:**
   * - Removes HTML special characters (<>"'&)
   * - Strips non-alphanumeric except whitespace, hyphens, underscores, periods, plus, asterisk
   * - Limits length to 100 characters
   *
   * **Usage:**
   * ```typescript
   * const sanitized = sanitizers.sanitizeSearchQuerySync(userInput);
   * ```
   *
   * @param query - Raw user input search query
   * @returns Sanitized, XSS-safe search query
   */
  sanitizeSearchQuerySync: (query: string): string => {
    const sanitized = query
      .replace(/[<>"'&]/g, '') // Remove HTML special characters
      .replace(/[^a-zA-Z0-9\s\-_.+*]/g, '') // Remove other special characters
      .trim()
      .substring(0, 100); // Limit length

    return sanitized;
  },

  /**
   * Sanitize URL parameters for safe URL construction
   * Encodes special characters and removes dangerous patterns
   *
   * @param param - Raw URL parameter value
   * @returns URL-safe parameter string
   */
  sanitizeURLParam: (param: string): string => {
    return encodeURIComponent(param)
      .replace(/[()]/g, '') // Remove parentheses (URL encoding edge cases)
      .substring(0, 200); // Limit length
  },

  /**
   * Sanitize display name for safe rendering
   * Removes HTML tags and control characters
   *
   * @param name - Raw display name
   * @returns Safe display name
   */
  sanitizeDisplayName: (name: string): string => {
    return name
      .replace(/[<>'"]/g, '') // Remove HTML special characters
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim()
      .substring(0, 100); // Limit length
  },
} as const;

/**
 * Validation helpers (non-Zod, pure boolean checks)
 * Simple, fast validations for client-side checks
 */
export const validators = {
  /**
   * Check if string is valid slug format
   * @param slug - String to validate
   * @returns true if valid slug (lowercase alphanumeric with hyphens)
   */
  isValidSlug: (slug: string): boolean => {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  },

  /**
   * Check if string is valid email format (basic check)
   * @param email - String to validate
   * @returns true if valid email format
   */
  isValidEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * Check if URL is valid and safe (https only)
   * @param url - String to validate
   * @returns true if valid HTTPS URL
   */
  isValidHttpsUrl: (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  },
} as const;
