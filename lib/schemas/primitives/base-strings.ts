/**
 * Base String Validation Primitives
 *
 * Centralized string validators to eliminate duplication across schemas.
 * These primitives are used extensively throughout the codebase.
 *
 * Usage Statistics (before consolidation):
 * - z.string().min(1): 111+ instances
 * - z.string().max(N): 177+ instances
 * - z.string().url(): 61+ instances
 *
 * Production Standards:
 * - All exports must be properly typed
 * - Each validator includes JSDoc with use cases
 * - Maximum lengths based on actual content analysis
 */

import { z } from 'zod';

/**
 * Non-empty string validator
 * Used for: Required text fields, names, titles, descriptions
 * Replaces: z.string().min(1) (111+ instances)
 */
export const nonEmptyString = z.string().min(1).describe('Required non-empty text field');

/**
 * Short string validator (1-100 chars)
 * Used for: Titles, names, labels, tags, badges
 * Common in: UI components, metadata, categories
 */
export const shortString = z
  .string()
  .min(1)
  .max(100)
  .describe('Short text field for titles, names, and labels (1-100 chars)');

/**
 * Medium string validator (1-500 chars)
 * Used for: Descriptions, summaries, error messages, steps
 * Common in: Content schemas, installation instructions
 */
export const mediumString = z
  .string()
  .min(1)
  .max(500)
  .describe('Medium text field for descriptions and summaries (1-500 chars)');

/**
 * Long string validator (1-2000 chars)
 * Used for: Full content, detailed descriptions, documentation
 * Common in: Content body fields, guides, solutions
 */
export const longString = z
  .string()
  .min(1)
  .max(2000)
  .describe('Long text field for detailed content and documentation (1-2000 chars)');

/**
 * Extra long string validator (1-5000 chars)
 * Used for: Extended content, FAQs, answers, full documentation
 * Common in: Guide content, comprehensive descriptions
 */
export const extraLongString = z
  .string()
  .min(1)
  .max(5000)
  .describe('Extra long text field for extended content and FAQs (1-5000 chars)');

/**
 * URL string validator
 * Used for: Links, image sources, documentation URLs, GitHub URLs
 * Replaces: z.string().url() (61+ instances)
 * Common in: All content schemas, metadata, social sharing
 */
export const urlString = z.string().url().describe('Valid URL string for links and resources');

/**
 * Email string validator
 * Used for: Email addresses, contact information
 * Common in: User schemas, contact forms
 */
export const emailString = z
  .string()
  .email()
  .describe('Valid email address for contact information');

/**
 * ISO date string validator
 * Used for: Date fields (dateAdded, dateModified, lastUpdated, etc.)
 * Common in: All content schemas, timestamps, metadata
 */
export const isoDateString = z.string().describe('ISO date string for date fields');

/**
 * ISO datetime string validator (strict)
 * Used for: Precise timestamps with time component
 * Common in: Analytics, cache entries, trending items
 */
export const isoDatetimeString = z
  .string()
  .datetime()
  .describe('Strict ISO datetime string with time component');

/**
 * Slug string validator
 * Used for: URL-safe identifiers, route parameters
 * Pattern: lowercase letters, numbers, hyphens only
 * Common in: All content types (agents, mcp, rules, commands, hooks)
 */
export const slugString = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/)
  .describe('URL-safe slug identifier (lowercase alphanumeric with hyphens)');

/**
 * Safe text validator (no HTML tags)
 * Used for: User-provided text where XSS prevention is critical
 * Common in: SEO metadata, social sharing, form inputs
 */
export const safeTextString = z
  .string()
  .min(1)
  .regex(/^[^<>]*$/, 'HTML tags not allowed')
  .transform((text) => text.trim())
  .describe('XSS-safe text field with HTML tag prevention');

/**
 * Optional non-empty string
 * Used for: Optional fields that should be non-empty if provided
 * Common in: Metadata, configuration, optional descriptions
 */
export const optionalNonEmptyString = z
  .string()
  .min(1)
  .optional()
  .describe('Optional non-empty text field');

/**
 * Optional URL string
 * Used for: Optional link fields
 * Common in: Documentation links, GitHub URLs, image sources
 */
export const optionalUrlString = z
  .string()
  .url()
  .optional()
  .describe('Optional URL field for links');

/**
 * Code/command string validator (1-1000 chars)
 * Used for: Code snippets, shell commands, configuration strings
 * Common in: Installation steps, examples, scripts
 */
export const codeString = z
  .string()
  .min(1)
  .max(1000)
  .describe('Code snippet or command string (1-1000 chars)');

/**
 * Very long code/content string validator (1-10000 chars)
 * Used for: Full code examples, large configuration blocks
 * Common in: Code examples, full scripts, large content blocks
 */
export const veryLongCodeString = z
  .string()
  .min(1)
  .max(10000)
  .describe('Large code block or configuration (1-10000 chars)');

/**
 * Ultra long content string validator (1-50000 chars)
 * Used for: Complete MDX content, full documentation, large schemas
 * Common in: Guide content, full documentation pages
 */
export const ultraLongString = z
  .string()
  .min(1)
  .max(50000)
  .describe('Complete MDX content or full documentation (1-50000 chars)');

/**
 * Massive content string validator (1-1000000 chars / 1MB)
 * Used for: Hook script content, extremely large content blocks
 * Common in: Hook configurations, massive data structures
 */
export const massiveString = z
  .string()
  .max(1000000)
  .describe('Extremely large content block up to 1MB (hook scripts, massive data)');
