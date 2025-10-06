/**
 * Content Sanitizer for LLMs.txt
 * Removes PII (Personally Identifiable Information) and sensitive data from content
 *
 * @module llms-txt/content-sanitizer
 * @security PII protection, data privacy, content safety
 */

import { z } from 'zod';
import { logger } from '@/src/lib/logger';

/**
 * Schema for content sanitization options
 * @description Configuration for what types of data to sanitize
 */
const sanitizationOptionsSchema = z
  .object({
    removeEmails: z.boolean().default(true).describe('Remove email addresses from content'),
    removePhones: z.boolean().default(true).describe('Remove phone numbers from content'),
    removeIPs: z.boolean().default(true).describe('Remove IP addresses from content'),
    removeAPIKeys: z.boolean().default(true).describe('Remove API keys and tokens'),
    removeSSNs: z.boolean().default(true).describe('Remove Social Security Numbers'),
    removeCreditCards: z.boolean().default(true).describe('Remove credit card numbers'),
    removePrivateKeys: z.boolean().default(true).describe('Remove private cryptographic keys'),
    replaceWithPlaceholder: z
      .boolean()
      .default(false)
      .describe('Replace sensitive data with [REDACTED] instead of removing'),
  })
  .describe('Options for content sanitization');

/**
 * Type exports
 */
export type SanitizationOptions = z.infer<typeof sanitizationOptionsSchema>;

/**
 * PII detection patterns
 * @description Regex patterns for identifying sensitive information
 */
const PII_PATTERNS = {
  // Email addresses (RFC 5322 simplified)
  email:
    /\b[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\b/g,

  // Phone numbers (US/International formats)
  phone:
    /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b|\b(?:\+?[0-9]{1,3}[-.\s]?)?(?:\([0-9]{1,4}\)|[0-9]{1,4})[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}\b/g,

  // IPv4 addresses
  ipv4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,

  // IPv6 addresses (simplified)
  ipv6: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b|\b::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}\b/g,

  // API keys and tokens (common patterns)
  apiKey: /\b(?:api[_-]?key|token|secret|password|passwd|pwd)[=:\s]*["']?([a-zA-Z0-9_-]{20,})\b/gi,

  // Generic tokens/keys (40+ hex chars or base64 patterns)
  genericToken: /\b[a-f0-9]{40,}\b|\b[A-Za-z0-9+/]{40,}={0,2}\b/g,

  // US Social Security Numbers
  ssn: /\b(?!000|666|9\d{2})\d{3}-?(?!00)\d{2}-?(?!0000)\d{4}\b/g,

  // Credit card numbers (Luhn-valid patterns)
  creditCard:
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,

  // Private keys (RSA, SSH, PGP)
  privateKey:
    /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----.+?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gs,

  // AWS Access Keys
  awsKey: /\b(?:AKIA|ASIA|AIDA)[A-Z0-9]{16}\b/g,

  // JWT tokens
  jwt: /\beyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g,
} as const;

/**
 * Whitelisted domains/patterns that should NOT be sanitized
 * @description Patterns for public/non-sensitive information
 * @remarks Global flag removed to prevent lastIndex state issues with .test()
 */
const WHITELIST_PATTERNS = {
  // Common public example domains
  exampleDomains: /@(?:example\.com|example\.org|test\.com|localhost)/i,

  // Documentation URLs with localhost/example IPs
  docIPs: /\b(?:127\.0\.0\.1|0\.0\.0\.0|localhost|192\.168\.x\.x|10\.x\.x\.x)\b/i,

  // Public documentation email examples
  docEmails: /@(?:company\.com|domain\.com|yourcompany\.com|yourdomain\.com)\b/i,
} as const;

/**
 * Check if text matches whitelist patterns
 * @param text - Text to check
 * @returns true if text should be whitelisted (not sanitized)
 */
function isWhitelisted(text: string): boolean {
  return Object.values(WHITELIST_PATTERNS).some((pattern) => pattern.test(text));
}

/**
 * Sanitize email addresses from text
 * @param text - Text containing potential emails
 * @param replace - Whether to replace with placeholder
 * @returns Sanitized text
 */
function sanitizeEmails(text: string, replace: boolean): string {
  return text.replace(PII_PATTERNS.email, (match) => {
    // Don't sanitize whitelisted example emails
    if (isWhitelisted(match)) {
      return match;
    }
    return replace ? '[EMAIL_REDACTED]' : '';
  });
}

/**
 * Sanitize phone numbers from text
 * @param text - Text containing potential phone numbers
 * @param replace - Whether to replace with placeholder
 * @returns Sanitized text
 */
function sanitizePhones(text: string, replace: boolean): string {
  return text.replace(PII_PATTERNS.phone, () => {
    return replace ? '[PHONE_REDACTED]' : '';
  });
}

/**
 * Sanitize IP addresses from text
 * @param text - Text containing potential IP addresses
 * @param replace - Whether to replace with placeholder
 * @returns Sanitized text
 */
function sanitizeIPs(text: string, replace: boolean): string {
  let result = text;

  // Check whitelist first
  if (isWhitelisted(text)) {
    return text;
  }

  result = result.replace(PII_PATTERNS.ipv4, () => (replace ? '[IP_REDACTED]' : ''));
  result = result.replace(PII_PATTERNS.ipv6, () => (replace ? '[IP_REDACTED]' : ''));

  return result;
}

/**
 * Sanitize API keys and tokens from text
 * @param text - Text containing potential API keys
 * @param replace - Whether to replace with placeholder
 * @returns Sanitized text
 */
function sanitizeAPIKeys(text: string, replace: boolean): string {
  let result = text;

  result = result.replace(PII_PATTERNS.apiKey, (match, key) => {
    // If it's a pattern like "api_key=..." keep the prefix
    if (replace && match.includes('=')) {
      return `${match.substring(0, match.indexOf(key))}[REDACTED]`;
    }
    return replace ? '[API_KEY_REDACTED]' : '';
  });

  result = result.replace(PII_PATTERNS.genericToken, () => {
    return replace ? '[TOKEN_REDACTED]' : '';
  });

  result = result.replace(PII_PATTERNS.awsKey, () => {
    return replace ? '[AWS_KEY_REDACTED]' : '';
  });

  result = result.replace(PII_PATTERNS.jwt, () => {
    return replace ? '[JWT_REDACTED]' : '';
  });

  return result;
}

/**
 * Sanitize Social Security Numbers from text
 * @param text - Text containing potential SSNs
 * @param replace - Whether to replace with placeholder
 * @returns Sanitized text
 */
function sanitizeSSNs(text: string, replace: boolean): string {
  return text.replace(PII_PATTERNS.ssn, () => {
    return replace ? '[SSN_REDACTED]' : '';
  });
}

/**
 * Sanitize credit card numbers from text
 * @param text - Text containing potential credit card numbers
 * @param replace - Whether to replace with placeholder
 * @returns Sanitized text
 */
function sanitizeCreditCards(text: string, replace: boolean): string {
  return text.replace(PII_PATTERNS.creditCard, () => {
    return replace ? '[CARD_REDACTED]' : '';
  });
}

/**
 * Sanitize private cryptographic keys from text
 * @param text - Text containing potential private keys
 * @param replace - Whether to replace with placeholder
 * @returns Sanitized text
 */
function sanitizePrivateKeys(text: string, replace: boolean): string {
  return text.replace(PII_PATTERNS.privateKey, () => {
    return replace ? '[PRIVATE_KEY_REDACTED]' : '';
  });
}

/**
 * Sanitize content for public LLMs.txt consumption
 *
 * @param content - Raw content to sanitize
 * @param options - Sanitization options (optional)
 * @returns Sanitized content safe for public consumption
 *
 * @remarks
 * This function removes or redacts sensitive information including:
 * - Email addresses (except whitelisted examples)
 * - Phone numbers
 * - IP addresses (except localhost/documentation IPs)
 * - API keys, tokens, and secrets
 * - Social Security Numbers
 * - Credit card numbers
 * - Private cryptographic keys
 *
 * @example
 * ```ts
 * const sanitized = sanitizeContent(
 *   "Contact us at support@example.com or call 555-1234",
 *   { removeEmails: false, removePhones: true }
 * );
 * // "Contact us at support@example.com or call"
 * ```
 */
export function sanitizeContent(content: string, options?: Partial<SanitizationOptions>): string {
  try {
    // Validate and merge options
    const opts = sanitizationOptionsSchema.parse(options || {});

    let sanitized = content;

    // Apply sanitization in order of sensitivity (most to least)
    if (opts.removePrivateKeys) {
      sanitized = sanitizePrivateKeys(sanitized, opts.replaceWithPlaceholder);
    }

    if (opts.removeAPIKeys) {
      sanitized = sanitizeAPIKeys(sanitized, opts.replaceWithPlaceholder);
    }

    if (opts.removeCreditCards) {
      sanitized = sanitizeCreditCards(sanitized, opts.replaceWithPlaceholder);
    }

    if (opts.removeSSNs) {
      sanitized = sanitizeSSNs(sanitized, opts.replaceWithPlaceholder);
    }

    if (opts.removeEmails) {
      sanitized = sanitizeEmails(sanitized, opts.replaceWithPlaceholder);
    }

    if (opts.removePhones) {
      sanitized = sanitizePhones(sanitized, opts.replaceWithPlaceholder);
    }

    if (opts.removeIPs) {
      sanitized = sanitizeIPs(sanitized, opts.replaceWithPlaceholder);
    }

    // Clean up multiple consecutive redactions
    if (opts.replaceWithPlaceholder) {
      sanitized = sanitized.replace(/(\[.*?_REDACTED\]\s*){2,}/g, '[REDACTED] ');
    }

    // Clean up extra whitespace left by removals
    sanitized = sanitized
      .replace(/ {2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return sanitized;
  } catch (error) {
    logger.error(
      'Failed to sanitize content',
      error instanceof Error ? error : new Error(String(error)),
      {
        contentLength: content?.length || 0,
        hasOptions: !!options,
      }
    );
    // In case of error, return empty string (fail secure)
    return '';
  }
}

/**
 * Detect if content contains potentially sensitive information
 *
 * @param content - Content to analyze
 * @returns Object with detected PII types
 *
 * @example
 * ```ts
 * const detection = detectPII("Email: test@example.com, API key: abc123...");
 * // { hasEmails: true, hasAPIKeys: true, ... }
 * ```
 */
export function detectPII(content: string): {
  hasEmails: boolean;
  hasPhones: boolean;
  hasIPs: boolean;
  hasAPIKeys: boolean;
  hasSSNs: boolean;
  hasCreditCards: boolean;
  hasPrivateKeys: boolean;
  hasPII: boolean;
} {
  // Reset lastIndex for all global regex patterns to ensure consistent .test() results
  // Global flag is needed for .replace() but causes state issues with .test()
  PII_PATTERNS.email.lastIndex = 0;
  PII_PATTERNS.phone.lastIndex = 0;
  PII_PATTERNS.ipv4.lastIndex = 0;
  PII_PATTERNS.ipv6.lastIndex = 0;
  PII_PATTERNS.apiKey.lastIndex = 0;
  PII_PATTERNS.genericToken.lastIndex = 0;
  PII_PATTERNS.ssn.lastIndex = 0;
  PII_PATTERNS.creditCard.lastIndex = 0;
  PII_PATTERNS.awsKey.lastIndex = 0;
  PII_PATTERNS.jwt.lastIndex = 0;

  const detection = {
    hasEmails: PII_PATTERNS.email.test(content),
    hasPhones: PII_PATTERNS.phone.test(content),
    hasIPs: PII_PATTERNS.ipv4.test(content) || PII_PATTERNS.ipv6.test(content),
    hasAPIKeys:
      PII_PATTERNS.apiKey.test(content) ||
      PII_PATTERNS.genericToken.test(content) ||
      PII_PATTERNS.awsKey.test(content) ||
      PII_PATTERNS.jwt.test(content),
    hasSSNs: PII_PATTERNS.ssn.test(content),
    hasCreditCards: PII_PATTERNS.creditCard.test(content),
    hasPrivateKeys: PII_PATTERNS.privateKey.test(content),
    hasPII: false,
  };

  detection.hasPII = Object.entries(detection).some(
    ([key, value]) => key !== 'hasPII' && value === true
  );

  return detection;
}
