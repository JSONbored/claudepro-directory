/**
 * Newsletter subscription validation schema
 * Security-first email validation following RFC 5322 compliance
 *
 * Pattern: Follows existing security patterns from form.schema.ts
 * Used by: newsletter-signup.ts Server Action
 */

import { z } from 'zod';
import { VALIDATION_PATTERNS } from '@/src/lib/security/patterns';

/**
 * Newsletter signup schema with strict email validation
 *
 * Security measures:
 * - RFC 5322 email format validation
 * - Length constraints (min 5, max 254 per RFC 5321)
 * - Lowercase normalization
 * - Trim whitespace
 * - Source tracking for analytics
 * - Referrer tracking for attribution
 */
export const newsletterSignupSchema = z.object({
  email: z
    .string()
    .min(5, 'Email address is too short')
    .max(254, 'Email address is too long')
    .email('Please enter a valid email address')
    .regex(VALIDATION_PATTERNS.EMAIL, 'Email format is invalid')
    .transform((val) => val.toLowerCase().trim())
    .describe('Subscriber email address (RFC 5322 compliant, normalized)'),

  // Optional: Signup source for analytics
  source: z
    .enum(['footer', 'homepage', 'modal', 'content_page', 'inline'])
    .optional()
    .describe('Signup source location for tracking conversion attribution'),

  // Optional: Referrer page for attribution
  referrer: z
    .string()
    .max(500, 'Referrer URL is too long')
    .optional()
    .describe('Page URL where signup occurred for analytics'),
});

/**
 * Type inference for input (before transformation)
 */
export type NewsletterSignupInput = z.input<typeof newsletterSignupSchema>;

/**
 * Type inference for output (after transformation - email lowercased/trimmed)
 */
export type NewsletterSignupData = z.output<typeof newsletterSignupSchema>;
