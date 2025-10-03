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
import { DOMPurify } from '../security/html-sanitizer';
import { VALIDATION_PATTERNS } from '../security/patterns';

// GitHub-related schemas for form submissions
export const gitHubConfigValidationSchema = z
  .object({
    token: nonEmptyString.describe('GitHub personal access token for API authentication'),
    owner: shortString.describe('GitHub repository owner username or organization name'),
    repo: shortString.describe('GitHub repository name'),
  })
  .describe('GitHub API configuration for repository operations');

export const issueCreationRequestSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Issue title is required')
      .max(200, 'Title too long')
      .describe('Issue title (1-200 characters)'),
    body: z
      .string()
      .min(1, 'Issue body is required')
      .max(50000, 'Body too long')
      .describe('Issue body content in markdown format (1-50000 characters)'),
    labels: z
      .array(shortString.describe('Label name'))
      .max(10, 'Too many labels')
      .default([])
      .describe('Array of label names to apply to the issue (max 10)'),
    assignees: z
      .array(shortString.describe('GitHub username'))
      .max(10, 'Too many assignees')
      .default([])
      .describe('Array of GitHub usernames to assign to the issue (max 10)'),
  })
  .describe('Request payload for creating a new GitHub issue');

export const issueCreationResponseSchema = z
  .object({
    issueNumber: positiveInt.describe('Created issue number from GitHub API'),
    issueUrl: urlString.describe('Full URL to the created GitHub issue'),
    success: z.boolean().describe('Whether the issue was created successfully'),
  })
  .describe('Response payload after creating a GitHub issue');

export const githubApiRateLimitSchema = z
  .object({
    remaining: z
      .number()
      .min(0)
      .describe('Number of API requests remaining in current rate limit window'),
    resetTime: isoDatetimeString.describe('ISO 8601 timestamp when rate limit resets'),
  })
  .describe('GitHub API rate limit information');

export const githubHealthCheckResponseSchema = z
  .object({
    configured: z.boolean().describe('Whether GitHub API credentials are configured'),
    authenticated: z.boolean().describe('Whether authentication with GitHub API is successful'),
    rateLimit: githubApiRateLimitSchema.optional().describe('Current rate limit status (optional)'),
  })
  .describe('GitHub API health check response with configuration and authentication status');

/**
 * Configuration submission form schema
 * Used for validating user-submitted configurations
 */
export const configSubmissionSchema = z
  .object({
    // Content type selection
    type: z
      .enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'guides'])
      .describe('Type of configuration content being submitted'),

    // Basic information
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters')
      .regex(
        /^[a-zA-Z0-9\s\-_.]+$/,
        'Name can only contain letters, numbers, spaces, hyphens, underscores, and dots'
      )
      .transform((val) => val.trim())
      .describe(
        'Configuration name (2-100 characters, alphanumeric with spaces/hyphens/underscores/dots)'
      ),

    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(500, 'Description must be less than 500 characters')
      .transform((val) => val.trim())
      .refine(
        (val) => !/<script|javascript:|data:|vbscript:|onclick|onerror|onload/i.test(val),
        'Description contains potentially malicious content'
      )
      .describe('Configuration description (10-500 characters, XSS-protected)'),

    // Category selection
    category: z
      .string()
      .min(2, 'Category is required')
      .max(50, 'Category must be less than 50 characters')
      .regex(/^[a-zA-Z0-9\s-]+$/, 'Category contains invalid characters')
      .describe('Content category (2-50 characters, alphanumeric with spaces and hyphens)'),

    // Author information
    author: z
      .string()
      .min(2, 'Author name must be at least 2 characters')
      .max(100, 'Author name must be less than 100 characters')
      .regex(/^[a-zA-Z0-9\s\-_.@]+$/, 'Author name contains invalid characters')
      .transform((val) => val.trim())
      .describe(
        'Author name (2-100 characters, alphanumeric with spaces/hyphens/underscores/dots/@)'
      ),

    // Optional GitHub URL
    github: z
      .string()
      .optional()
      .refine(
        (val) => !val || VALIDATION_PATTERNS.GITHUB_URL.test(val),
        'Must be a valid GitHub URL (https://github.com/username/repo)'
      )
      .describe(
        'Optional GitHub repository URL (must match https://github.com/username/repo format)'
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
      }, 'Configuration must be a JSON object')
      .describe('Configuration content as valid JSON object string (2-50000 characters)'),

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
      })
      .describe('Comma-separated tags (alphanumeric with spaces/commas/hyphens, max 10 tags)'),
  })
  .describe('User-submitted configuration form data with security validation');

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
 * @public - knip ignore tag (used by structured data components)
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
 * @public - knip ignore tag (used via highlightedCodeSafeSchema transform)
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

/**
 * Passthrough schema for Turbopack/SSR compatibility
 * @public - knip ignore tag (used in code highlighting components)
 */
export const highlightedCodeSafeSchema = z
  .string()
  .describe('Raw HTML string containing syntax-highlighted code')
  .transform(sanitizeHighlightedCode);
