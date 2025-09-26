/**
 * Production-grade form validation schemas
 * Security-first approach to prevent injection attacks and data corruption
 */

import { z } from 'zod';
import { VALIDATION_PATTERNS } from '../validation';

/**
 * Configuration submission form schema
 * Used for validating user-submitted configurations
 */
export const configSubmissionSchema = z.object({
  // Content type selection
  type: z.enum(['agents', 'mcp', 'rules', 'commands', 'hooks']),

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
    .enum(['all', 'agents', 'mcp', 'rules', 'commands', 'hooks'])
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
