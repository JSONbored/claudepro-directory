/**
 * Production-grade form validation schemas
 * Security-first approach to prevent injection attacks and data corruption
 *
 * CLEANED - Removed 32 unused exports (74% waste eliminated)
 */

import { z } from 'zod';
import { positiveInt } from '@/lib/schemas/primitives/base-numbers';
import {
  isoDatetimeString,
  nonEmptyString,
  shortString,
  urlString,
} from '@/lib/schemas/primitives/base-strings';
import { DOMPurify, VALIDATION_PATTERNS } from '../security';

// GitHub-related schemas for form submissions
export const gitHubConfigValidationSchema = z.object({
  token: nonEmptyString.describe('GitHub token is required'),
  owner: shortString.describe('GitHub owner is required'),
  repo: shortString.describe('GitHub repo is required'),
});

export const issueCreationRequestSchema = z.object({
  title: z.string().min(1, 'Issue title is required').max(200, 'Title too long'),
  body: z.string().min(1, 'Issue body is required').max(50000, 'Body too long'),
  labels: z.array(shortString).max(10, 'Too many labels').default([]),
  assignees: z.array(shortString).max(10, 'Too many assignees').default([]),
});

export const issueCreationResponseSchema = z.object({
  issueNumber: positiveInt.describe('Issue number must be positive'),
  issueUrl: urlString.describe('Invalid issue URL'),
  success: z.boolean(),
});

export const githubApiRateLimitSchema = z.object({
  remaining: z.number().min(0),
  resetTime: isoDatetimeString,
});

export const githubHealthCheckResponseSchema = z.object({
  configured: z.boolean(),
  authenticated: z.boolean(),
  rateLimit: githubApiRateLimitSchema.optional(),
});

/**
 * Configuration submission form schema
 * Used for validating user-submitted configurations
 */
export const configSubmissionSchema = z.object({
  // Content type selection
  type: z.enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'guides']),

  // Basic information
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(
      /^[a-zA-Z0-9\s\-_.]+$/,
      'Name can only contain letters, numbers, spaces, hyphens, underscores, and dots'
    )
    .transform((val) => val.trim()),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .transform((val) => val.trim())
    .refine(
      (val) => !/<script|javascript:|data:|vbscript:|onclick|onerror|onload/i.test(val),
      'Description contains potentially malicious content'
    ),

  // Category selection
  category: z
    .string()
    .min(2, 'Category is required')
    .max(50, 'Category must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Category contains invalid characters'),

  // Author information
  author: z
    .string()
    .min(2, 'Author name must be at least 2 characters')
    .max(100, 'Author name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.@]+$/, 'Author name contains invalid characters')
    .transform((val) => val.trim()),

  // Optional GitHub URL
  github: z
    .string()
    .optional()
    .refine(
      (val) => !val || VALIDATION_PATTERNS.GITHUB_URL.test(val),
      'Must be a valid GitHub URL (https://github.com/username/repo)'
    ),

  // Configuration content (JSON)
  content: z
    .string()
    .min(2, 'Configuration content is required')
    .max(50000, 'Configuration content is too large')
    .transform((val) => val.trim())
    .refine((val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    }, 'Configuration must be valid JSON')
    .refine((val) => {
      try {
        const parsed = JSON.parse(val);
        // Ensure it's an object, not an array or primitive
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
      } catch {
        return false;
      }
    }, 'Configuration must be a JSON object'),

  // Tags (comma-separated)
  tags: z
    .string()
    .optional()
    .transform((val) => val?.trim() || '')
    .refine(
      (val) => !val || /^[a-zA-Z0-9\s,-]+$/.test(val),
      'Tags can only contain letters, numbers, spaces, commas, and hyphens'
    )
    .transform((val) => {
      if (!val) return [];
      return val
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .slice(0, 10); // Maximum 10 tags
    }),
});

/**
 * Type inference for form data
 */
export type ConfigSubmissionInput = z.input<typeof configSubmissionSchema>;
export type ConfigSubmissionData = z.output<typeof configSubmissionSchema>;

/**
 * FormData parser that safely extracts and validates form data
 */
export function parseConfigSubmissionForm(formData: FormData): ConfigSubmissionData {
  // Safely extract form data without type assertions
  const rawData = {
    type: formData.get('type'),
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    author: formData.get('author'),
    github: formData.get('github'),
    content: formData.get('content'),
    tags: formData.get('tags'),
  };

  // Convert FormDataEntryValue to strings safely
  const stringData = Object.fromEntries(
    Object.entries(rawData).map(([key, value]) => [key, value === null ? undefined : String(value)])
  );

  // Validate and parse
  return configSubmissionSchema.parse(stringData);
}

/**
 * JSON-LD structured data validator
 * Production-grade XSS prevention for SSR environments
 *
 * Security Strategy:
 * - Validates JSON structure
 * - Blocks script injection attempts
 * - Escapes dangerous characters (< becomes \u003c per Next.js JSON-LD best practices)
 * - Pure function for Turbopack/SSR compatibility (no Zod in SSR path)
 *
 * @see https://nextjs.org/docs/app/guides/json-ld
 * @see https://www.rapid7.com/blog/post/2022/05/04/xss-in-json-old-school-attacks-for-modern-applications/
 */
export function validateJsonLdSafe(data: unknown): unknown {
  // Stringify with security validation
  const jsonString = JSON.stringify(data);

  // Security checks (multi-layered defense)
  if (/<script\b/i.test(jsonString)) {
    throw new Error('Script tags are not allowed in JSON-LD data');
  }

  if (/javascript:/i.test(jsonString)) {
    throw new Error('JavaScript protocol not allowed in JSON-LD data');
  }

  if (/<iframe\b/i.test(jsonString)) {
    throw new Error('Iframe tags are not allowed in JSON-LD data');
  }

  // Parse to ensure valid JSON structure
  return JSON.parse(jsonString);
}

/**
 * Serialize JSON-LD safely for SSR rendering
 * Escapes < characters to prevent XSS per security best practices
 *
 * Usage: dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
 */
export function serializeJsonLd(data: unknown): string {
  const validated = validateJsonLdSafe(data);
  // Escape < to \u003c to prevent XSS (industry standard for JSON in HTML)
  return JSON.stringify(validated).replace(/</g, '\\u003c');
}

/**
 * Syntax-highlighted code sanitizer
 * Validates that HTML comes from trusted syntax highlighter
 *
 * Pure function for SSR compatibility
 */
export function sanitizeHighlightedCode(html: string): string {
  // Allow specific classes and elements used by syntax highlighters
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['pre', 'code', 'span', 'div'],
    ALLOWED_ATTR: ['class', 'style', 'data-language'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    // Allow style attribute but sanitize its content
    ALLOW_DATA_ATTR: false,
  });
}

// Passthrough schema for Turbopack/SSR compatibility
export const highlightedCodeSafeSchema = z.string().transform(sanitizeHighlightedCode);
