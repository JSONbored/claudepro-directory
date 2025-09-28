/**
 * API Request/Response Validation Schemas
 * Production-grade validation for all API endpoints with security-first approach
 * Assumes hostile actors can view and manipulate this code
 */

import { z } from 'zod';

/**
 * Security-focused constants for API validation
 */
const API_LIMITS = {
  MAX_PAGE_SIZE: 100,
  MAX_PAGE_NUMBER: 10000,
  MAX_QUERY_LENGTH: 200,
  MAX_HEADER_LENGTH: 2048,
  MAX_BODY_SIZE: 10485760, // 10MB
  MAX_URL_LENGTH: 2048,
  MAX_TAGS: 50,
  MAX_ARRAY_LENGTH: 1000,
  MIN_RATE_LIMIT_WINDOW: 60, // seconds
  MAX_RATE_LIMIT_WINDOW: 86400, // 24 hours
} as const;

/**
 * Common HTTP headers validation
 * Validates headers against known attack vectors
 */
export const httpHeadersSchema = z
  .object({
    'content-type': z
      .string()
      .max(100, 'Content-type is too long')
      .regex(/^[a-zA-Z0-9/\-+.;=\s]+$/, 'Invalid content-type format')
      .optional(),
    'user-agent': z.string().max(500, 'User-agent is too long').optional(),
    accept: z
      .string()
      .max(200, 'Accept header is too long')
      .regex(/^[a-zA-Z0-9/\-+.,*;=\s]+$/, 'Invalid accept header')
      .optional(),
    'accept-language': z
      .string()
      .max(100, 'Content-type is too long')
      .regex(/^[a-zA-Z\-,;=.\s]+$/, 'Invalid accept-language header')
      .optional(),
    'cache-control': z
      .string()
      .max(100, 'Content-type is too long')
      .regex(/^[a-zA-Z0-9\-=,\s]+$/, 'Invalid cache-control header')
      .optional(),
    'if-none-match': z
      .string()
      .max(200, 'Accept header is too long')
      .regex(/^[a-zA-Z0-9\-"/]+$/, 'Invalid if-none-match header')
      .optional(),
    'x-forwarded-for': z
      .string()
      .max(200, 'Accept header is too long')
      .regex(
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:,\s*(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))*$/,
        'Invalid X-Forwarded-For IP format'
      )
      .optional(),
    'cf-connecting-ip': z
      .string()
      .regex(
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        'Invalid CF-Connecting-IP format'
      )
      .optional(),
    authorization: z
      .string()
      .max(API_LIMITS.MAX_HEADER_LENGTH)
      .regex(/^Bearer [A-Za-z0-9\-._~+/]+=*$/, 'Invalid authorization format')
      .optional(),
    'x-api-key': z
      .string()
      .max(256, 'Signature is too long')
      .regex(/^[A-Za-z0-9\-_]+$/, 'Invalid API key format')
      .optional(),
    'x-request-id': z
      .string()
      .max(128, 'Timestamp is too long')
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        'Invalid request ID format (must be UUID)'
      )
      .optional(),
    origin: z
      .string()
      .max(500, 'Content is too long')
      .regex(/^https?:\/\/[a-zA-Z0-9\-.:]+$/, 'Invalid origin format')
      .optional(),
    referer: z.string().max(API_LIMITS.MAX_URL_LENGTH).url('Invalid referer URL').optional(),
  })
  .strict()
  .refine(
    (headers) => {
      // Prevent header injection attacks
      const dangerous = Object.entries(headers).some(([, value]) => {
        if (typeof value !== 'string') return false;
        return value.includes('\n') || value.includes('\r') || value.includes('\0');
      });
      return !dangerous;
    },
    { message: 'Headers contain dangerous characters' }
  );

/**
 * Content type parameter validation
 * Strict validation for dynamic content type routes
 */
export const contentTypeParamSchema = z.object({
  contentType: z
    .string()
    .regex(
      /^(agents|mcp|rules|commands|hooks)\.json$/,
      'Invalid content type. Must be one of: agents.json, mcp.json, rules.json, commands.json, hooks.json'
    )
    .transform((val) => val.toLowerCase()),
});

/**
 * API pagination parameters
 * Prevents resource exhaustion attacks
 */
export const apiPaginationSchema = z.object({
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .max(API_LIMITS.MAX_PAGE_NUMBER, `Page cannot exceed ${API_LIMITS.MAX_PAGE_NUMBER}`)
    .default(1),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(API_LIMITS.MAX_PAGE_SIZE, `Limit cannot exceed ${API_LIMITS.MAX_PAGE_SIZE}`)
    .default(20),
  offset: z.coerce
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset must be non-negative')
    .max(API_LIMITS.MAX_PAGE_NUMBER * API_LIMITS.MAX_PAGE_SIZE, 'Offset too large')
    .optional(),
});

/**
 * Search API parameters
 * Protects against injection and DoS attacks
 */
export const searchApiSchema = z
  .object({
    q: z
      .string()
      .min(1, 'Search query is required')
      .max(API_LIMITS.MAX_QUERY_LENGTH, `Query too long (max ${API_LIMITS.MAX_QUERY_LENGTH} chars)`)
      .regex(/^[^<>'"&]*$/, 'Query contains invalid characters')
      .transform((val) => val.trim()),
    category: z
      .enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'guides', 'all'])
      .optional()
      .default('all'),
    tags: z
      .array(
        z
          .string()
          .min(1, 'Tag must not be empty')
          .max(50, 'Tag is too long')
          .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid tag format')
      )
      .max(API_LIMITS.MAX_TAGS, `Too many tags (max ${API_LIMITS.MAX_TAGS})`)
      .optional(),
    sortBy: z
      .enum(['relevance', 'date', 'name', 'popularity', 'views'])
      .optional()
      .default('relevance'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    includeContent: z.boolean().optional().default(false),
  })
  .merge(apiPaginationSchema);

/**
 * Cache warming API parameters
 * Controls cache operations to prevent abuse
 */
export const cacheWarmApiSchema = z.object({
  types: z
    .array(z.enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'guides']))
    .min(1, 'At least one type required')
    .max(10, 'Too many types specified')
    .optional(),
  force: z.boolean().optional().default(false),
  priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
  secret: z
    .string()
    .regex(/^[A-Za-z0-9\-_]{32,64}$/, 'Invalid secret format')
    .optional(),
});

/**
 * API rate limiting configuration schema
 * Validates rate limit settings for API endpoints
 */
export const apiRateLimitConfigSchema = z.object({
  window: z
    .number()
    .int()
    .min(
      API_LIMITS.MIN_RATE_LIMIT_WINDOW,
      `Window must be at least ${API_LIMITS.MIN_RATE_LIMIT_WINDOW}s`
    )
    .max(
      API_LIMITS.MAX_RATE_LIMIT_WINDOW,
      `Window cannot exceed ${API_LIMITS.MAX_RATE_LIMIT_WINDOW}s`
    ),
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(10000, 'Limit cannot exceed 10000'),
  keyGenerator: z.enum(['ip', 'api-key', 'user-agent', 'combined']).optional().default('ip'),
  skipSuccessfulRequests: z.boolean().optional().default(false),
  skipFailedRequests: z.boolean().optional().default(false),
});

/**
 * API Response schemas for type-safe responses
 */

// Standard error response
export const apiErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z
    .array(
      z.object({
        path: z.string(),
        message: z.string(),
        code: z.string().optional(),
      })
    )
    .optional(),
  timestamp: z.string().datetime(),
  requestId: z.string().uuid().optional(),
});

// Standard success response wrapper
export const apiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z
      .object({
        timestamp: z.string().datetime(),
        version: z.string().optional(),
        cache: z.enum(['HIT', 'MISS', 'BYPASS']).optional(),
      })
      .optional(),
  });

// Paginated response
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema).max(API_LIMITS.MAX_ARRAY_LENGTH),
    pagination: z.object({
      total: z.number().int().min(0),
      page: z.number().int().min(1),
      limit: z.number().int().min(1).max(API_LIMITS.MAX_PAGE_SIZE),
      pages: z.number().int().min(0),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
    meta: z
      .object({
        timestamp: z.string().datetime(),
        processingTime: z.number().min(0).optional(),
        cache: z.enum(['HIT', 'MISS', 'BYPASS']).optional(),
      })
      .optional(),
  });

// Content API response
const contentItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const contentApiResponseSchema = z.object({
  agents: z.array(contentItemSchema).optional(),
  mcp: z.array(contentItemSchema).optional(),
  rules: z.array(contentItemSchema).optional(),
  commands: z.array(contentItemSchema).optional(),
  hooks: z.array(contentItemSchema).optional(),
  count: z.number().int().min(0),
  lastUpdated: z.string().datetime(),
});

// Cache warm response
export const cacheWarmResponseSchema = z.object({
  success: z.boolean(),
  warmed: z.array(z.string()),
  failed: z.array(z.string()).optional(),
  duration: z.number().min(0),
  timestamp: z.string().datetime(),
});

/**
 * Webhook payload schemas
 * Validates incoming webhook data for security
 */
export const webhookPayloadSchema = z
  .object({
    event: z.enum([
      'content.created',
      'content.updated',
      'content.deleted',
      'cache.cleared',
      'deployment.success',
      'deployment.failed',
    ]),
    timestamp: z.string().datetime(),
    signature: z.string().regex(/^[A-Za-z0-9+/=]{64,}$/, 'Invalid signature format'),
    data: z
      .record(
        z.string(),
        z.union([
          z.string(),
          z.number(),
          z.boolean(),
          z.array(z.union([z.string(), z.number(), z.boolean()])),
        ])
      )
      .optional(),
    source: z.string().max(100, 'Source is too long').optional(),
    version: z.string().optional(),
  })
  .strict();

/**
 * External API response schemas
 * Validates responses from third-party services
 */
export const githubApiResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  stargazers_count: z.number(),
  watchers_count: z.number(),
  language: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  pushed_at: z.string().datetime(),
  topics: z.array(z.string()).optional(),
});

export const npmApiResponseSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  homepage: z.string().url().optional(),
  repository: z
    .object({
      type: z.string(),
      url: z.string(),
    })
    .optional(),
  downloads: z.number().optional(),
});

/**
 * API request body schemas
 */
export const submitConfigBodySchema = z
  .object({
    type: z.enum(['agent', 'mcp', 'rule', 'command', 'hook']),
    name: z.string().min(2, 'Name too short').max(200, 'Name is too long'),
    description: z.string().min(10, 'Description too short').max(2000, 'Description is too long'),
    content: z.string().min(1, 'Content is required').max(1000000, 'Content exceeds 1MB limit'), // 1MB max
    author: z.string().min(1, 'Author is required').max(100, 'Author name is too long'),
    email: z.string().email().optional(),
    githubUrl: z.string().url().startsWith('https://github.com/').optional(),
    tags: z
      .array(z.string().min(1, 'Tag must not be empty').max(50, 'Tag is too long'))
      .max(20, 'Too many tags')
      .optional(),
    version: z.string().optional(),
  })
  .strict();

/**
 * Helper function to validate API requests
 */
export function validateApiRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  _context = 'API request'
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Helper to create consistent API error responses
 */
export function createApiErrorResponse(
  error: string,
  message: string,
  details?: z.ZodIssue[],
  code?: string
) {
  return {
    error,
    message,
    code,
    details: details?.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    })),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Type exports for use throughout the application
 */
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
export type ContentApiResponse = z.infer<typeof contentApiResponseSchema>;
export type CacheWarmResponse = z.infer<typeof cacheWarmResponseSchema>;
export type ApiPaginationParams = z.infer<typeof apiPaginationSchema>;
export type SearchApiParams = z.infer<typeof searchApiSchema>;
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
export type SubmitConfigBody = z.infer<typeof submitConfigBodySchema>;
export type HttpHeaders = z.infer<typeof httpHeadersSchema>;
export type ContentTypeParam = z.infer<typeof contentTypeParamSchema>;
export type ApiPagination = z.infer<typeof apiPaginationSchema>;
export type CacheWarmApi = z.infer<typeof cacheWarmApiSchema>;
export type ApiRateLimitConfig = z.infer<typeof apiRateLimitConfigSchema>;
export type GithubApiResponse = z.infer<typeof githubApiResponseSchema>;
export type NpmApiResponse = z.infer<typeof npmApiResponseSchema>;
