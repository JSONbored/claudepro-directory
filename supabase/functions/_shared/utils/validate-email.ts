/**
 * Email validation and normalization utility
 * Validates email format and normalizes for storage
 */

import { createUtilityContext, logWarn } from './logging.ts';

export interface ValidateEmailResult {
  valid: boolean;
  normalized?: string;
  error?: string;
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
    required?: boolean;
    maxLength?: number;
  } = {}
): ValidateEmailResult {
  const { required = true, maxLength = MAX_EMAIL_LENGTH } = options;

  // Check if email is provided
  if (!email) {
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
    const logContext = createUtilityContext('validate-email', 'email-too-long', {
      email_length: trimmed.length,
      max_length: maxLength,
    });
    logWarn('Email address too long', logContext);
    return {
      valid: false,
      error: `Email address too long (max ${maxLength} characters)`,
    };
  }

  // Validate format
  if (!EMAIL_REGEX.test(trimmed)) {
    const logContext = createUtilityContext('validate-email', 'invalid-format', {
      email_preview: trimmed.slice(0, 50), // Log first 50 chars for debugging
    });
    logWarn('Invalid email format', logContext);
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
    const logContext = createUtilityContext('validate-email', 'security-check-failed', {
      check: 'null_bytes',
    });
    logWarn('Security check failed: null bytes detected', logContext);
    return {
      valid: false,
      error: 'Email address contains invalid characters',
    };
  }

  // Prevent path traversal attempts
  if (normalized.includes('..') || normalized.includes('//')) {
    const logContext = createUtilityContext('validate-email', 'security-check-failed', {
      check: 'path_traversal',
    });
    logWarn('Security check failed: path traversal detected', logContext);
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
