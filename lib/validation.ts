/**
 * Production-grade input validation schemas with strict regex patterns
 * Designed for security-first validation against hostile input
 */

import { z } from 'zod';

/**
 * Security-focused regex patterns for strict validation
 */
export const VALIDATION_PATTERNS = {
  // Alphanumeric with safe special characters only
  SAFE_STRING: /^[a-zA-Z0-9\s\-_.,!?()[\]{}'"]+$/,

  // Strict slug format (URL-safe)
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,

  // Content type validation (exact match)
  CONTENT_TYPE: /^(agents|mcp|rules|commands|hooks)\.json$/,

  // File extensions (security-focused)
  SAFE_FILE_EXT: /^[a-zA-Z0-9_-]+\.(json|md|txt|yaml|yml)$/i,

  // Version strings (semantic versioning)
  VERSION:
    /^v?(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*))?(?:\+([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*))?$/,

  // UUID format
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

  // Email (strict RFC 5322 subset)
  EMAIL:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

  // URL (strict HTTP/HTTPS only)
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,

  // GitHub URL specifically
  GITHUB_URL: /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\/.*)?$/,

  // IP address (IPv4 and IPv6)
  IP_ADDRESS:
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,

  // Safe search query (no SQL injection patterns)
  SEARCH_QUERY: /^[a-zA-Z0-9\s\-_.,!?()[\]{}'"]*$/,

  // Cache keys (Redis-safe)
  CACHE_KEY: /^[a-zA-Z0-9:_-]{1,250}$/,

  // Auth tokens (base64 format)
  AUTH_TOKEN: /^[A-Za-z0-9+/=]{40,2048}$/,
} as const;

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
      .transform(transforms.sanitizeString),

  // Strict slug validation
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(VALIDATION_PATTERNS.SLUG, 'Invalid slug format')
    .transform(transforms.normalizeSlug),

  // Content type validation
  contentType: z.string().regex(VALIDATION_PATTERNS.CONTENT_TYPE, 'Invalid content type'),

  // Search query with sanitization
  searchQuery: z
    .string()
    .max(200, 'Search query too long')
    .regex(VALIDATION_PATTERNS.SEARCH_QUERY, 'Search query contains invalid characters')
    .transform(transforms.sanitizeSearch)
    .optional(),

  // Pagination parameters
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .max(10000, 'Page number too large')
    .default(1),

  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(1000, 'Limit too large')
    .default(50),

  // UUID validation
  uuid: z.string().regex(VALIDATION_PATTERNS.UUID, 'Invalid UUID format'),

  // Email validation
  email: z
    .string()
    .regex(VALIDATION_PATTERNS.EMAIL, 'Invalid email format')
    .max(254, 'Email too long'),

  // URL validation
  url: z.string().regex(VALIDATION_PATTERNS.URL, 'Invalid URL format').max(2048, 'URL too long'),

  // GitHub URL validation
  githubUrl: z
    .string()
    .regex(VALIDATION_PATTERNS.GITHUB_URL, 'Invalid GitHub URL')
    .max(500, 'GitHub URL too long'),

  // IP address validation
  ipAddress: z.string().regex(VALIDATION_PATTERNS.IP_ADDRESS, 'Invalid IP address'),

  // Cache key validation
  cacheKey: z.string().regex(VALIDATION_PATTERNS.CACHE_KEY, 'Invalid cache key format'),

  // Auth token validation
  authToken: z.string().regex(VALIDATION_PATTERNS.AUTH_TOKEN, 'Invalid authentication token'),
} as const;

/**
 * API-specific validation schemas
 */
export const apiSchemas = {
  // Content API parameters
  contentTypeParams: z.object({
    contentType: baseSchemas.contentType,
  }),

  // Search parameters
  searchParams: z.object({
    q: baseSchemas.searchQuery,
    category: z.enum(['agents', 'mcp', 'rules', 'commands', 'hooks']).optional(),
    page: baseSchemas.page,
    limit: baseSchemas.limit,
    sortBy: z.enum(['relevance', 'date', 'name', 'popularity']).default('relevance'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Cache warming parameters
  cacheWarmParams: z.object({
    types: z.array(z.enum(['agents', 'mcp', 'rules', 'commands', 'hooks'])).optional(),
    force: z.boolean().default(false),
  }),

  // Pagination query parameters
  paginationQuery: z.object({
    page: baseSchemas.page,
    limit: baseSchemas.limit,
    offset: z.coerce.number().int().min(0).max(100000).optional(),
  }),

  // Request headers validation
  requestHeaders: z.object({
    'user-agent': z.string().max(500).optional(),
    accept: z.string().max(200).optional(),
    'accept-language': z.string().max(100).optional(),
    'cache-control': z.string().max(100).optional(),
    'if-none-match': z.string().max(200).optional(),
    'x-forwarded-for': baseSchemas.ipAddress.optional(),
    'cf-connecting-ip': baseSchemas.ipAddress.optional(),
    authorization: z.string().max(2048).optional(),
  }),
} as const;

/**
 * Content validation schemas for different types
 */
export const contentSchemas = {
  // Agent configuration validation
  agent: z.object({
    name: baseSchemas.safeString(2, 200),
    description: baseSchemas.safeString(10, 2000),
    slug: baseSchemas.slug,
    author: baseSchemas.safeString(1, 100),
    version: z.string().regex(VALIDATION_PATTERNS.VERSION, 'Invalid version format').optional(),
    tags: z.array(baseSchemas.safeString(1, 50)).max(20, 'Too many tags'),
    githubUrl: baseSchemas.githubUrl.optional(),
    documentation: baseSchemas.url.optional(),
    license: z.enum(['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC']).optional(),
  }),

  // MCP server validation
  mcp: z.object({
    name: baseSchemas.safeString(2, 200),
    description: baseSchemas.safeString(10, 2000),
    slug: baseSchemas.slug,
    npmPackage: z
      .string()
      .regex(/^[@a-z0-9][@a-z0-9-_]*\/[a-z0-9-_]+$|^[a-z0-9-_]+$/, 'Invalid npm package name')
      .optional(),
    githubUrl: baseSchemas.githubUrl.optional(),
    capabilities: z
      .array(z.enum(['tools', 'resources', 'prompts']))
      .min(1, 'At least one capability required'),
    category: z.enum(['productivity', 'development', 'ai', 'utilities', 'integration']),
  }),

  // Rule validation
  rule: z.object({
    name: baseSchemas.safeString(2, 200),
    description: baseSchemas.safeString(10, 1000),
    slug: baseSchemas.slug,
    category: z.enum(['formatting', 'behavior', 'security', 'performance', 'accessibility']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    applicability: z.array(z.enum(['chat', 'code', 'analysis', 'writing'])).min(1),
  }),

  // Command validation
  command: z.object({
    name: baseSchemas.safeString(2, 200),
    description: baseSchemas.safeString(10, 1000),
    slug: baseSchemas.slug,
    syntax: baseSchemas.safeString(1, 500),
    platform: z.enum(['claude', 'cursor', 'vscode', 'terminal', 'universal']),
    category: z.enum(['navigation', 'editing', 'analysis', 'generation', 'utility']),
  }),

  // Hook validation
  hook: z.object({
    name: baseSchemas.safeString(2, 200),
    description: baseSchemas.safeString(10, 1000),
    slug: baseSchemas.slug,
    event: z.enum(['pre-request', 'post-request', 'pre-response', 'post-response', 'error']),
    language: z.enum(['javascript', 'typescript', 'python', 'bash', 'powershell']),
    framework: z.enum(['express', 'fastapi', 'django', 'nextjs', 'generic']).optional(),
  }),
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

export default validation;

/**
 * Input Cleaning Utilities
 * Basic input normalization for data quality
 * Security is handled by Arcjet Shield WAF at the edge
 * Edge Runtime compatible - pure JavaScript, no DOM dependencies
 */
export const sanitizers = {
  /**
   * Clean search queries for better search results
   * Security: Arcjet Shield blocks XSS at WAF level
   * This just ensures clean data for search functionality
   */
  sanitizeSearchQuery: (query: string): string => {
    // Allow: letters, numbers, spaces, hyphens, underscores, dots, and common search operators
    return query
      .replace(/[^a-zA-Z0-9\s\-_.+*]/g, '') // Keep only search-relevant characters
      .trim()
      .substring(0, 100); // Reasonable search query length
  },

  /**
   * Clean form input for data consistency
   * Security: Arcjet Shield handles injection protection
   * This just ensures consistent data format
   */
  sanitizeFormInput: (input: string, maxLength = 500): string => {
    return input.trim().substring(0, maxLength);
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
      .replace(/data:/gi, '') // Remove data: protocol
      .trim();

    // Encode for URL
    return encodeURIComponent(sanitized);
  },

  /**
   * Validate and sanitize category input
   * Ensures only valid categories are accepted
   */
  sanitizeCategory: (category: string): string | null => {
    const validCategories = [
      'agents',
      'mcp',
      'rules',
      'commands',
      'hooks',
      'tutorials',
      'comparisons',
      'workflows',
      'use-cases',
      'troubleshooting',
    ];

    const sanitized = sanitizers.sanitizeFormInput(category, 50).toLowerCase();

    if (validCategories.includes(sanitized)) {
      return sanitized;
    }

    return null;
  },

  /**
   * Sanitize array of tags
   * Ensures each tag is safe and valid
   */
  sanitizeTags: (tags: string[]): string[] => {
    return tags
      .map((tag) => sanitizers.sanitizeFormInput(tag, 50))
      .filter((tag) => tag.length > 0 && tag.length <= 50)
      .slice(0, 20); // Limit to 20 tags
  },

  /**
   * Create a text excerpt from content
   * Strips HTML for clean text previews
   */
  createSafeExcerpt: (content: string, maxLength = 160): string => {
    // Simple HTML tag removal - no DOM needed
    const textOnly = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[a-z]+;/gi, ' '); // Replace HTML entities with space

    return textOnly
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, maxLength);
  },
} as const;

// Re-export individual functions for backward compatibility
export const {
  sanitizeSearchQuery,
  sanitizeFormInput,
  sanitizeURLParam,
  sanitizeCategory,
  sanitizeTags,
  createSafeExcerpt,
} = sanitizers;
