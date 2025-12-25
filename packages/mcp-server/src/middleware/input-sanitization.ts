/**
 * Enhanced Input Sanitization Middleware
 *
 * Provides comprehensive input validation and sanitization for MCP tool inputs.
 * Prevents XSS, injection attacks, and invalid data from reaching handlers.
 *
 * Features:
 * - String sanitization (XSS prevention)
 * - URL validation
 * - Slug validation
 * - Email validation
 * - Array validation
 * - Object validation
 * - Type coercion where appropriate
 */

import { sanitizeText, sanitizeUrl, validateEmail } from '@heyclaude/shared-runtime';
import { z } from 'zod';

/**
 * Input sanitization options
 */
export interface InputSanitizationOptions {
  /**
   * Maximum string length (default: 10000)
   */
  maxStringLength?: number;

  /**
   * Whether to allow HTML in strings (default: false)
   */
  allowHtml?: boolean;

  /**
   * Whether to allow newlines in strings (default: true)
   */
  allowNewlines?: boolean;

  /**
   * Whether to trim strings (default: true)
   */
  trimStrings?: boolean;
}

/**
 * Default sanitization options
 */
const DEFAULT_OPTIONS: Required<InputSanitizationOptions> = {
  maxStringLength: 10000,
  allowHtml: false,
  allowNewlines: true,
  trimStrings: true,
};

/**
 * Sanitize a string input
 *
 * @param input - String to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string
 */
export function sanitizeString(input: string, options: InputSanitizationOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Trim if enabled
  let sanitized = opts.trimStrings ? input.trim() : input;

  // Sanitize using shared-runtime utility
  sanitized = sanitizeText(sanitized, {
    allowHtml: opts.allowHtml,
    allowNewlines: opts.allowNewlines,
    maxLength: opts.maxStringLength,
  });

  return sanitized;
}

/**
 * Validate and sanitize a URL
 *
 * @param url - URL string to validate
 * @returns Sanitized URL or throws error if invalid
 */
export function validateAndSanitizeUrl(url: string): string {
  const sanitized = sanitizeUrl(url);
  if (sanitized.length === 0) {
    throw new Error('Invalid URL format');
  }
  return sanitized;
}

/**
 * Validate and sanitize an email address
 *
 * @param email - Email string to validate
 * @returns Validated email or throws error if invalid
 */
export function validateAndSanitizeEmail(email: string): string {
  if (!validateEmail(email)) {
    throw new Error('Invalid email address format');
  }
  return email.trim().toLowerCase();
}

/**
 * Validate and sanitize a slug
 *
 * @param slug - Slug string to validate
 * @returns Validated slug or throws error if invalid
 */
export function validateAndSanitizeSlug(slug: string): string {
  // Slug pattern: 3-100 lowercase alphanumeric characters, hyphens, underscores, dots
  const slugPattern = /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/;
  const trimmed = slug.trim().toLowerCase();

  if (trimmed.length < 3 || trimmed.length > 100) {
    throw new Error('Slug must be 3-100 characters long');
  }

  if (!slugPattern.test(trimmed)) {
    throw new Error(
      'Slug must contain only lowercase letters, numbers, hyphens, underscores, and dots'
    );
  }

  return trimmed;
}

/**
 * Sanitize an array of strings
 *
 * @param input - Array of strings to sanitize
 * @param options - Sanitization options
 * @returns Sanitized array
 */
export function sanitizeStringArray(
  input: unknown[],
  options: InputSanitizationOptions = {}
): string[] {
  return input
    .filter((item): item is string => typeof item === 'string')
    .map((item) => sanitizeString(item, options))
    .filter((item) => item.length > 0); // Remove empty strings after sanitization
}

/**
 * Sanitize an object recursively
 *
 * @param input - Object to sanitize
 * @param options - Sanitization options
 * @returns Sanitized object
 */
export function sanitizeObject(
  input: Record<string, unknown>,
  options: InputSanitizationOptions = {}
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    // Sanitize key
    const sanitizedKey = sanitizeString(key, { ...options, maxStringLength: 100 });

    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value, options);
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = sanitizeStringArray(value, options);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[sanitizedKey] = sanitizeObject(value as Record<string, unknown>, options);
    } else {
      // Numbers, booleans, null, etc. - pass through
      sanitized[sanitizedKey] = value;
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize input using Zod schema
 * Combines Zod validation with additional sanitization
 *
 * @param schema - Zod schema for validation
 * @param input - Input to validate and sanitize
 * @param options - Sanitization options
 * @returns Validated and sanitized input
 */
export function validateAndSanitizeInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  options: InputSanitizationOptions = {}
): T {
  // First, sanitize string values in the input
  const sanitizedInput =
    typeof input === 'string'
      ? sanitizeString(input, options)
      : typeof input === 'object' && input !== null && !Array.isArray(input)
        ? sanitizeObject(input as Record<string, unknown>, options)
        : input;

  // Then validate with Zod
  return schema.parse(sanitizedInput);
}

/**
 * Wrap a tool handler with input sanitization
 *
 * @param schema - Zod schema for input validation
 * @param handler - Tool handler function
 * @param options - Sanitization options
 * @returns Wrapped handler with sanitization
 */
export function withInputSanitization<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (input: TInput, context: unknown) => Promise<TOutput>,
  options: InputSanitizationOptions = {}
): (input: unknown, context: unknown) => Promise<TOutput> {
  return async (input: unknown, context: unknown): Promise<TOutput> => {
    // Validate and sanitize input
    const sanitizedInput = validateAndSanitizeInput(schema, input, options);

    // Execute handler with sanitized input
    return handler(sanitizedInput, context);
  };
}
