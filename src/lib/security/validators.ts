/**
 * Input Validators
 * Production-grade input validation schemas with strict security patterns
 * Part of unified lib/security/ module
 */

import { z } from 'zod';
import { isValidCategory } from '@/src/lib/config/category-config';
import { VALID_CATEGORIES } from '@/src/lib/config/category-types';
import { DOMPurify } from './html-sanitizer';
import { VALIDATION_PATTERNS } from './patterns';

/**
 * Custom Zod transformations for secure data handling
 */
export const transforms = {
  // Sanitize string input - remove control characters for security
  sanitizeString: (value: string) => {
    // biome-ignore lint/suspicious/noControlCharactersInRegex: Security validation requires control character removal
    return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  },

  // Normalize slug
  normalizeSlug: (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''),

  // Sanitize search query
  sanitizeSearch: (value: string) =>
    value
      .trim()
      .replace(/[<>'"&]/g, '')
      .substring(0, 200),

  // Parse positive integer
  positiveInt: (value: string | number) => {
    const num = typeof value === 'string' ? Number.parseInt(value, 10) : value;
    return Number.isNaN(num) || num < 0 ? 0 : num;
  },
} as const;

/**
 * Base validation schemas
 */
export const baseSchemas = {
  // Safe string with length limits
  safeString: (min = 1, max = 1000) =>
    z
      .string()
      .min(min, `Must be at least ${min} characters`)
      .max(max, `Must be no more than ${max} characters`)
      .regex(VALIDATION_PATTERNS.SAFE_STRING, 'Contains invalid characters')
      .transform(transforms.sanitizeString)
      .describe(
        `Sanitized string with configurable length limits (min: ${min}, max: ${max}). Auto-removes control characters and validates against safe character set.`
      ),

  // Strict slug validation
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(VALIDATION_PATTERNS.SLUG, 'Invalid slug format')
    .transform(transforms.normalizeSlug)
    .describe(
      'URL-safe slug identifier (1-100 chars). Auto-normalized to lowercase with hyphens, allowing only alphanumeric characters and hyphens.'
    ),

  // Content type validation
  contentType: z
    .string()
    .regex(VALIDATION_PATTERNS.CONTENT_TYPE, 'Invalid content type')
    .describe(
      'Content category identifier with .json extension. Auto-validated against UNIFIED_CATEGORY_REGISTRY categories.'
    ),

  // Search query with sanitization
  searchQuery: z
    .string()
    .max(200, 'Search query too long')
    .regex(VALIDATION_PATTERNS.SEARCH_QUERY, 'Search query contains invalid characters')
    .transform(transforms.sanitizeSearch)
    .optional()
    .describe(
      'Search query string for filtering content (max 200 chars, auto-sanitized for security)'
    ),

  // Pagination parameters
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .max(10000, 'Page number too large')
    .default(1)
    .describe('Page number for pagination (1-based index, max 10,000)'),

  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(1000, 'Limit too large')
    .default(50)
    .describe('Number of items per page (1-1000, default 50)'),

  // UUID validation
  uuid: z
    .string()
    .regex(VALIDATION_PATTERNS.UUID, 'Invalid UUID format')
    .describe('RFC 4122 compliant UUID (versions 1-5). Format: 8-4-4-4-12 hexadecimal characters.'),

  // Email validation
  email: z
    .string()
    .regex(VALIDATION_PATTERNS.EMAIL, 'Invalid email format')
    .max(254, 'Email too long')
    .describe(
      'RFC 5322 compliant email address (max 254 chars). Format: local-part@domain with proper email syntax validation.'
    ),

  // URL validation
  url: z
    .string()
    .regex(VALIDATION_PATTERNS.URL, 'Invalid URL format')
    .max(2048, 'URL too long')
    .describe(
      'Valid HTTP/HTTPS URL (max 2048 chars). Supports standard URL format with protocol, domain, path, and query parameters.'
    ),

  // GitHub URL validation
  githubUrl: z
    .string()
    .regex(VALIDATION_PATTERNS.GITHUB_URL, 'Invalid GitHub URL')
    .max(500, 'GitHub URL too long')
    .describe(
      'Valid GitHub repository URL (max 500 chars). Format: https://github.com/owner/repo or github.com/owner/repo.'
    ),

  // IP address validation
  ipAddress: z
    .string()
    .regex(VALIDATION_PATTERNS.IP_ADDRESS, 'Invalid IP address')
    .describe(
      'Valid IPv4 or IPv6 address. Supports standard IP address formats for client identification.'
    ),

  // Cache key validation
  cacheKey: z
    .string()
    .regex(VALIDATION_PATTERNS.CACHE_KEY, 'Invalid cache key format')
    .describe(
      'Redis-compatible cache key. Alphanumeric with colons, hyphens, and underscores for namespace separation.'
    ),

  // Auth token validation
  authToken: z
    .string()
    .regex(VALIDATION_PATTERNS.AUTH_TOKEN, 'Invalid authentication token')
    .describe(
      'Bearer authentication token. Base64-encoded string (min 32 chars) for API authentication and authorization.'
    ),
} as const;

/**
 * API-specific validation schemas
 */
export const apiSchemas = {
  // Content API parameters
  contentTypeParams: z
    .object({
      contentType: baseSchemas.contentType,
    })
    .describe(
      'Content type route parameters for dynamic category pages. Used to validate [category] route segments.'
    ),

  // Search parameters
  searchParams: z
    .object({
      q: baseSchemas.searchQuery,
      category: z
        .enum(VALID_CATEGORIES)
        .optional()
        .describe('Filter search results by content category'),
      page: baseSchemas.page,
      limit: baseSchemas.limit,
      sortBy: z
        .enum(['relevance', 'date', 'name', 'popularity'])
        .default('relevance')
        .describe('Field to sort results by (relevance, date, name, or popularity)'),
      sortOrder: z
        .enum(['asc', 'desc'])
        .default('desc')
        .describe('Sort direction: ascending (asc) or descending (desc)'),
    })
    .describe('Search API query parameters with filtering, pagination, and sorting'),

  // Cache warming parameters
  cacheWarmParams: z
    .object({
      types: z
        .array(z.enum(VALID_CATEGORIES))
        .optional()
        .describe('Array of content types to warm cache for (omit for all types)'),
      force: z
        .boolean()
        .default(false)
        .describe('Force cache refresh even if cache is warm (default: false)'),
    })
    .describe('Cache warming API parameters for pre-loading content into Redis'),

  // Pagination query parameters
  paginationQuery: z
    .object({
      page: baseSchemas.page,
      limit: baseSchemas.limit,
      offset: z.coerce.number().int().min(0).max(100000).optional(),
    })
    .describe(
      'Pagination query parameters for list endpoints. Supports page-based (page/limit) or offset-based (offset/limit) pagination.'
    ),

  // Request headers validation
  requestHeaders: z
    .object({
      'user-agent': z.string().max(500).optional(),
      accept: z.string().max(200).optional(),
      'accept-language': z.string().max(100).optional(),
      'cache-control': z.string().max(100).optional(),
      'if-none-match': z.string().max(200).optional(),
      'x-forwarded-for': baseSchemas.ipAddress.optional(),
      'cf-connecting-ip': baseSchemas.ipAddress.optional(),
      authorization: z.string().max(2048).optional(),
    })
    .describe(
      'Standard HTTP request headers validation. Includes client info (user-agent), content negotiation (accept), caching (if-none-match), client IP (x-forwarded-for, cf-connecting-ip), and auth (authorization).'
    ),
} as const;

/**
 * Validation error handling
 */
export class ValidationError extends Error {
  public readonly code: string;
  public readonly details: z.ZodError;

  constructor(zodError: z.ZodError, context?: string) {
    const message = context
      ? `Validation failed in ${context}: ${zodError.issues.map((e) => e.message).join(', ')}`
      : `Validation failed: ${zodError.issues.map((e) => e.message).join(', ')}`;

    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.details = zodError;
  }
}

/**
 * Validation utilities
 */
export const validation = {
  // Validate and transform data with detailed error handling
  validate: <T>(schema: z.ZodSchema<T>, data: unknown, context?: string): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error, context);
      }
      throw error;
    }
  },

  // Safe validation that returns result object
  safeParse: <T>(schema: z.ZodSchema<T>, data: unknown) => {
    const result = schema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : null,
      error: result.success ? null : new ValidationError(result.error),
    };
  },

  // Validate request parameters
  validateParams: <T>(
    schema: z.ZodSchema<T>,
    params: unknown,
    context = 'request parameters'
  ): T => {
    return validation.validate(schema, params, context);
  },

  // Validate query parameters
  validateQuery: <T>(schema: z.ZodSchema<T>, query: unknown, context = 'query parameters'): T => {
    return validation.validate(schema, query, context);
  },

  // Validate request body
  validateBody: <T>(schema: z.ZodSchema<T>, body: unknown, context = 'request body'): T => {
    return validation.validate(schema, body, context);
  },

  // Validate request headers
  validateHeaders: <T>(
    schema: z.ZodSchema<T>,
    headers: unknown,
    context = 'request headers'
  ): T => {
    return validation.validate(schema, headers, context);
  },
} as const;

/**
 * XSS Sanitization Utilities
 * Provides secure sanitization for user input
 * Consolidated from lib/sanitizer.ts for better maintainability
 *
 * Security: Uses DOMPurify for HTML sanitization instead of regex patterns
 * which are vulnerable to bypasses and edge cases.
 */

/**
 * Secure HTML tag stripper using DOMPurify
 * Removes all HTML tags from a string using battle-tested library
 *
 * Security benefits over regex:
 * - Handles all HTML/XSS edge cases (e.g., </script\t\n bar>)
 * - Prevents multi-character sanitization bypasses (e.g., <scr<script>ipt>)
 * - Actively maintained and used by major companies
 * - No performance issues with complex patterns
 */
async function stripHtmlTags(str: string): Promise<string> {
  // Use DOMPurify to strip all HTML tags while keeping text content
  return DOMPurify.sanitize(str, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
    KEEP_CONTENT: true, // Keep text content between tags
  });
}

export const sanitizers = {
  /**
   * Sanitize search queries to prevent XSS attacks (server-side with full DOMPurify)
   * Allows only alphanumeric characters, spaces, hyphens, and underscores
   */
  sanitizeSearchQuery: async (query: string): Promise<string> => {
    // First, remove any HTML/Script tags
    const htmlSanitized = await stripHtmlTags(query);

    // Then apply additional restrictions for search queries
    // Allow: letters, numbers, spaces, hyphens, underscores, dots, and common search operators
    const searchSanitized = htmlSanitized
      .replace(/[^a-zA-Z0-9\s\-_.+*]/g, '') // Remove special characters except common search ones
      .trim()
      .substring(0, 100); // Limit length

    return searchSanitized;
  },

  /**
   * Sanitize search queries to prevent XSS attacks (client-side sync version)
   * Uses simpler regex-based sanitization for client components
   */
  sanitizeSearchQuerySync: (query: string): string => {
    // Client-side: Use regex-based sanitization (faster, no DOMPurify needed)
    const sanitized = query
      .replace(/[<>"'&]/g, '') // Remove HTML special characters
      .replace(/[^a-zA-Z0-9\s\-_.+*]/g, '') // Remove other special characters
      .trim()
      .substring(0, 100); // Limit length

    return sanitized;
  },

  /**
   * Sanitize form input fields
   * Strips all HTML and limits length
   */
  sanitizeFormInput: async (input: string, maxLength = 500): Promise<string> => {
    const sanitized = await stripHtmlTags(input);
    return sanitized.trim().substring(0, maxLength);
  },

  /**
   * Sanitize URL parameters
   * Ensures safe URL construction
   */
  sanitizeURLParam: (param: string): string => {
    // Remove any potential URL injection attempts
    const sanitized = param
      .replace(/[<>"'`]/g, '') // Remove HTML/JS injection characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .trim();

    // Encode for URL
    return encodeURIComponent(sanitized);
  },

  /**
   * Validate and sanitize category input
   * Ensures only valid categories are accepted
   * Auto-validated against UNIFIED_CATEGORY_REGISTRY
   */
  sanitizeCategory: async (category: string): Promise<string | null> => {
    const sanitized = (await sanitizers.sanitizeFormInput(category, 50)).toLowerCase();

    // Type guard validation instead of type assertion
    if (isValidCategory(sanitized)) {
      return sanitized;
    }

    return null;
  },

  /**
   * Sanitize array of tags
   * Ensures each tag is safe and valid
   */
  sanitizeTags: async (tags: string[]): Promise<string[]> => {
    // Inline Promise.all mapping (was batchMap) - removed batch.utils dependency
    const sanitizedTags = await Promise.all(
      tags.map((tag) => sanitizers.sanitizeFormInput(tag, 50))
    );
    return sanitizedTags.filter((tag) => tag.length > 0 && tag.length <= 50).slice(0, 20); // Limit to 20 tags
  },

  /**
   * Create a sanitized excerpt from HTML content
   * Useful for meta descriptions and previews
   */
  createSafeExcerpt: async (html: string, maxLength = 160): Promise<string> => {
    const textOnly = await stripHtmlTags(html);

    return textOnly
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, maxLength);
  },
} as const;
