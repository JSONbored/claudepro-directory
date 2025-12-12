/**
 * Email validation and normalization utility
 * Validates email format and normalizes for storage
 */

import { logger } from './logger/index.ts';

export interface ValidateEmailResult {
  error?: string;
  normalized?: string;
  valid: boolean;
}

/**
 * RFC 5322 compliant email regex (simplified)
 * Matches most valid email addresses while preventing common injection attempts
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Maximum email length (RFC 5321)
 */
const MAX_EMAIL_LENGTH = 254;

/**
 * Validate and normalize email address
 * @param email - Email address to validate
 * @param options - Validation options
 * @returns Validation result with normalized email if valid
 */
export function validateEmail(
  email: unknown,
  options: {
    maxLength?: number;
    required?: boolean;
  } = {}
): ValidateEmailResult {
  const { required = true, maxLength = MAX_EMAIL_LENGTH } = options;

  // Check if email is provided - handles null, undefined, empty string, and falsy values
  if (email === null || email === undefined || email === '') {
    if (required) {
      return {
        valid: false,
        error: 'Email address is required',
      };
    }
    return { valid: true };
  }

  // Check if email is a string
  if (typeof email !== 'string') {
    return {
      valid: false,
      error: 'Email must be a string',
    };
  }

  // Trim and normalize
  const trimmed = email.trim();

  // Check if empty after trimming
  if (trimmed.length === 0) {
    if (required) {
      return {
        valid: false,
        error: 'Email address cannot be empty',
      };
    }
    return { valid: true };
  }

  // Check length
  if (trimmed.length > maxLength) {
    logger.warn({
      function: 'validate-email',
      operation: 'email-too-long',
      email_length: trimmed.length,
      max_length: maxLength,
    }, 'Email address too long');
    return {
      valid: false,
      error: `Email address too long (max ${maxLength} characters)`,
    };
  }

  // Validate format
  if (!EMAIL_REGEX.test(trimmed)) {
    logger.warn({
      function: 'validate-email',
      operation: 'invalid-format',
      email_preview: trimmed.slice(0, 50), // Log first 50 chars for debugging
    }, 'Invalid email format');
    return {
      valid: false,
      error: 'Invalid email address format',
    };
  }

  // Normalize to lowercase
  const normalized = trimmed.toLowerCase();

  // Additional security checks
  // Prevent null bytes
  if (normalized.includes('\0')) {
    logger.warn({
      function: 'validate-email',
      operation: 'security-check-failed',
      check: 'null_bytes',
    }, 'Security check failed: null bytes detected');
    return {
      valid: false,
      error: 'Email address contains invalid characters',
    };
  }

  // Prevent path traversal attempts
  if (normalized.includes('..') || normalized.includes('//')) {
    logger.warn({
      function: 'validate-email',
      operation: 'security-check-failed',
      check: 'path_traversal',
    }, 'Security check failed: path traversal detected');
    return {
      valid: false,
      error: 'Email address contains invalid characters',
    };
  }

  return {
    valid: true,
    normalized,
  };
}
