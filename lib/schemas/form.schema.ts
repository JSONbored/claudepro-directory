/**
 * Production-grade form validation schemas
 * Security-first approach to prevent injection attacks and data corruption
 */

import { z } from 'zod';
import { VALIDATION_PATTERNS } from '../validation';

// GitHub-related schemas for form submissions
export const gitHubConfigValidationSchema = z.object({
  token: z.string().min(1, 'GitHub token is required'),
  owner: z.string().min(1, 'GitHub owner is required').max(100),
  repo: z.string().min(1, 'GitHub repo is required').max(100),
});

export const issueCreationRequestSchema = z.object({
  title: z.string().min(1, 'Issue title is required').max(200, 'Title too long'),
  body: z.string().min(1, 'Issue body is required').max(50000, 'Body too long'),
  labels: z.array(z.string().min(1).max(50)).max(10, 'Too many labels').default([]),
  assignees: z.array(z.string().min(1).max(50)).max(10, 'Too many assignees').default([]),
});

export const issueCreationResponseSchema = z.object({
  issueNumber: z.number().int().positive('Issue number must be positive'),
  issueUrl: z.string().url('Invalid issue URL'),
  success: z.boolean(),
});

export const githubApiRateLimitSchema = z.object({
  remaining: z.number().int().min(0),
  resetTime: z.string().datetime(),
});

export const githubHealthCheckResponseSchema = z.object({
  configured: z.boolean(),
  authenticated: z.boolean(),
  rateLimit: githubApiRateLimitSchema.optional(),
});

// GitHub-related type exports
export type GitHubConfigValidation = z.infer<typeof gitHubConfigValidationSchema>;
export type IssueCreationRequest = z.infer<typeof issueCreationRequestSchema>;
export type IssueCreationResponse = z.infer<typeof issueCreationResponseSchema>;
export type GitHubApiRateLimit = z.infer<typeof githubApiRateLimitSchema>;
export type GitHubHealthCheckResponse = z.infer<typeof githubHealthCheckResponseSchema>;

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
 * Contact form schema
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),

  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email address is too long')
    .toLowerCase(),

  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),

  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(5000, 'Message must be less than 5000 characters')
    .refine(
      (val) => !/<script|javascript:|data:|vbscript:|onclick|onerror|onload/i.test(val),
      'Message contains potentially malicious content'
    ),

  // Honeypot field for bot detection
  website: z.string().max(0, 'Bot detected').optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * Newsletter subscription schema
 */
export const newsletterSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email address is too long')
    .toLowerCase()
    .refine(
      (email) => !email.includes('+'),
      'Plus addressing is not allowed for newsletter subscriptions'
    ),

  // GDPR consent
  consent: z.literal(true),
});

export type NewsletterData = z.infer<typeof newsletterSchema>;

/**
 * Search form schema
 */
export const searchFormSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query is too long')
    .transform((val) => val.trim())
    .refine((val) => val.length >= 2, 'Search query must be at least 2 characters after trimming')
    .transform((val) => {
      // Sanitize search query
      return val
        .replace(/[<>'"&]/g, '') // Remove potential XSS characters
        .replace(/\s+/g, ' '); // Normalize whitespace
    }),

  category: z
    .enum(['all', 'agents', 'mcp', 'rules', 'commands', 'hooks', 'guides'])
    .optional()
    .default('all'),

  sortBy: z.enum(['relevance', 'date', 'popularity']).optional().default('relevance'),

  limit: z.number().int().min(1).max(100).optional().default(20),
});

export type SearchFormData = z.infer<typeof searchFormSchema>;

/**
 * Feedback form schema
 */
export const feedbackFormSchema = z.object({
  rating: z.number().int().min(1).max(5),

  feedback: z
    .string()
    .min(10, 'Feedback must be at least 10 characters')
    .max(1000, 'Feedback must be less than 1000 characters')
    .refine(
      (val) => !/<script|javascript:|data:|vbscript:|onclick|onerror|onload/i.test(val),
      'Feedback contains potentially malicious content'
    ),

  email: z.string().email('Please enter a valid email address').optional(),

  // Anonymous submission option
  anonymous: z.boolean().optional().default(false),
});

export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;
export type ConfigSubmission = z.infer<typeof configSubmissionSchema>;
export type ContactForm = z.infer<typeof contactFormSchema>;
export type Newsletter = z.infer<typeof newsletterSchema>;
export type SearchForm = z.infer<typeof searchFormSchema>;
export type FeedbackForm = z.infer<typeof feedbackFormSchema>;

/**
 * Helper function to create safe FormData parser
 */
export function createFormDataParser<T extends z.ZodType>(schema: T) {
  return (formData: FormData): z.infer<T> => {
    const data: Record<string, unknown> = {};

    // Safely extract all form data
    for (const [key, value] of formData.entries()) {
      // Handle multiple values for the same key (e.g., checkboxes)
      if (key in data) {
        const existing = data[key];
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          data[key] = [existing, value];
        }
      } else {
        data[key] = value;
      }
    }

    // Convert FormDataEntryValue to appropriate types
    const processedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (value === null || value === undefined) {
          return [key, undefined];
        }
        if (Array.isArray(value)) {
          return [key, value.map((v) => String(v))];
        }
        return [key, String(value)];
      })
    );

    return schema.parse(processedData);
  };
}

/**
 * Export all form parsers
 */
export const formParsers = {
  configSubmission: createFormDataParser(configSubmissionSchema),
  contact: createFormDataParser(contactFormSchema),
  newsletter: createFormDataParser(newsletterSchema),
  search: createFormDataParser(searchFormSchema),
  feedback: createFormDataParser(feedbackFormSchema),
} as const;

/**
 * HTML Sanitization Schemas for XSS Prevention
 * Comprehensive sanitization for different content contexts
 */

/**
 * Sanitized HTML content schema
 * Removes dangerous elements while preserving safe formatting
 */
export const sanitizedHtmlSchema = z.string().transform((html) => {
  // Security: Arcjet Shield handles XSS protection at WAF level
  // This just removes HTML tags for clean data
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
    .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove styles
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
    .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove objects
    .replace(/<embed[^>]*>/gi, '') // Remove embeds
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove event handlers
    .replace(/on\w+\s*=\s*'[^']*'/gi, '') // Remove event handlers
    .replace(/javascript:/gi, ''); // Remove javascript: protocol
});

// Note: These constants are for documentation only
// We rely on Arcjet Shield WAF for actual XSS protection

/**
 * Strict text-only schema (no HTML allowed)
 * Use for contexts where HTML should never be present
 */
export const textOnlySchema = z.string().transform((str) => {
  // Remove all HTML tags to get plain text
  return str
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&[a-z]+;/gi, ' ') // Replace HTML entities
    .trim();
});

/**
 * JSON-LD structured data schema
 * Ensures no script injection in JSON content while supporting nested objects
 */
type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

const jsonLdValue: z.ZodType<JsonLdValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonLdValue),
    z.record(z.string(), jsonLdValue),
  ])
);

export const jsonLdSafeSchema = jsonLdValue.transform((data) => {
  // Convert to JSON string to ensure it's safe
  const jsonString = JSON.stringify(data);

  // Check for script tag injection attempts
  if (/<script\b/i.test(jsonString)) {
    throw new Error('Script tags are not allowed in JSON-LD data');
  }

  // Ensure no JavaScript protocol handlers
  if (/javascript:/i.test(jsonString)) {
    throw new Error('JavaScript protocol not allowed in JSON-LD data');
  }

  // Parse back to ensure valid JSON
  return JSON.parse(jsonString);
});

/**
 * Code block sanitization schema
 * Preserves code but ensures it can't execute
 */
export const codeBlockSafeSchema = z.string().transform((code) => {
  // Escape HTML entities to prevent execution
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
});

/**
 * Syntax-highlighted code schema
 * Validates that HTML comes from trusted syntax highlighter
 */
export const highlightedCodeSafeSchema = z.string().transform((html) => {
  // Allow specific classes and elements used by syntax highlighters
  // Remove dangerous elements but keep code highlighting structure
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove event handlers
    .replace(/javascript:/gi, ''); // Remove javascript: protocol
});

/**
 * Markdown-derived HTML schema
 * More permissive but still safe for user-generated content
 */
export const markdownHtmlSafeSchema = z.string().transform((html) => {
  // Remove dangerous elements while keeping markdown structure
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove event handlers
    .replace(/javascript:/gi, ''); // Remove javascript: protocol
});

// Note: We don't need to maintain allowed tag lists
// Arcjet Shield WAF handles security at the edge

/**
 * URL parameter sanitization schema
 * Prevents URL injection attacks
 */
export const urlParamSafeSchema = z.string().transform((param) => {
  // Remove potential injection characters
  const cleaned = param
    .replace(/[<>"'`]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .trim();

  // URL encode for safety
  return encodeURIComponent(cleaned);
});

/**
 * Export type definitions for sanitization schemas
 */
export type SanitizedHTML = z.infer<typeof sanitizedHtmlSchema>;
export type TextOnly = z.infer<typeof textOnlySchema>;
export type SafeJSONLD = z.infer<typeof jsonLdSafeSchema>;
export type SafeCodeBlock = z.infer<typeof codeBlockSafeSchema>;
export type SafeHighlightedCode = z.infer<typeof highlightedCodeSafeSchema>;
export type SafeMarkdownHTML = z.infer<typeof markdownHtmlSafeSchema>;
export type SafeURLParam = z.infer<typeof urlParamSafeSchema>;
