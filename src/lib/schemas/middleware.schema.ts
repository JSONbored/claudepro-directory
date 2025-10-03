/**
 * Middleware Validation Schemas
 * Production-grade validation for HTTP requests and middleware operations
 * Ensures request integrity and security validation
 */

import { z } from 'zod';
import { nonNegativeInt, positiveInt } from './primitives/base-numbers';
import { nonEmptyString } from './primitives/base-strings';

/**
 * Security constants for middleware
 */
const MIDDLEWARE_LIMITS = {
  MAX_PATH_LENGTH: 2048,
  MAX_HEADER_VALUE_LENGTH: 8192,
  MAX_USER_AGENT_LENGTH: 512,
  MAX_IP_ADDRESS_LENGTH: 45, // IPv6 max length
  MAX_SEARCH_QUERY_LENGTH: 500,
  MAX_FORM_DATA_SIZE: 1048576, // 1MB
} as const;

/**
 * Valid HTTP methods
 */
const httpMethodSchema = z
  .enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])
  .describe('Standard HTTP methods allowed in middleware operations');

/**
 * Valid request paths (with security checks)
 */
export const requestPathSchema = nonEmptyString
  .max(MIDDLEWARE_LIMITS.MAX_PATH_LENGTH)
  .refine((path) => path.startsWith('/'), 'Path must start with /')
  .refine((path) => !path.includes('..'), 'Path traversal detected')
  .refine((path) => !path.includes('\\'), 'Backslash not allowed in paths')
  .refine((path) => !path.includes('\0'), 'Null bytes not allowed in paths')
  .describe(
    'Validated request path with security checks against path traversal and malicious patterns'
  );

/**
 * IP address validation
 */
export const ipAddressSchema = z
  .string()
  .max(MIDDLEWARE_LIMITS.MAX_IP_ADDRESS_LENGTH)
  .refine((ip) => {
    // Basic IPv4/IPv6 format check with IPv6 compressed notation support
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 regex supporting compressed notation (::)
    const ipv6Regex =
      /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|::([fF]{4}(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    const localhost = ['127.0.0.1', '::1', 'localhost'];

    return ipv4Regex.test(ip) || ipv6Regex.test(ip) || localhost.includes(ip);
  }, 'Invalid IP address format')
  .describe(
    'Valid IPv4, IPv6 (with compressed notation), or localhost address format with length limits'
  );

/**
 * User agent validation
 * Allow all characters except control characters for modern browsers
 */
const userAgentSchema = z
  .string()
  .max(MIDDLEWARE_LIMITS.MAX_USER_AGENT_LENGTH)
  .transform((ua) => {
    // Remove control characters (0-31 and 127 in ASCII)
    // Using individual character codes to avoid linter warnings
    let cleaned = ua;
    for (let i = 0; i <= 31; i++) {
      cleaned = cleaned.replace(new RegExp(String.fromCharCode(i), 'g'), '');
    }
    cleaned = cleaned.replace(new RegExp(String.fromCharCode(127), 'g'), '');
    return cleaned;
  })
  .describe('Browser user agent string sanitized by removing control characters');

/**
 * Content type validation
 * More flexible to handle charset parameters (e.g., text/plain;charset=UTF-8)
 * Includes Next.js server action content types
 */
const httpContentTypeSchema = z
  .string()
  .transform((value) => value?.split(';')[0]?.trim().toLowerCase() || '')
  .refine(
    (value) =>
      [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain',
        'text/html',
        'application/octet-stream',
        'application/x-next-server-action',
        'application/x-vercel-request-body',
      ].includes(value),
    'Invalid content type'
  )
  .describe('Valid HTTP content type header normalized to lowercase without charset parameters');

/**
 * Static asset paths
 */
export const staticAssetSchema = z
  .string()
  .refine(
    (path) =>
      path.startsWith('/_next/static') ||
      path.startsWith('/_next/image') ||
      path === '/favicon.ico' ||
      path === '/robots.txt' ||
      path === '/sitemap.xml' ||
      path === '/manifest.json' ||
      path === '/manifest.webmanifest' ||
      path === '/manifest' ||
      path === '/service-worker.js' ||
      path === '/offline.html' ||
      /\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)$/.test(path),
    'Not a valid static asset path'
  )
  .describe('Path to static assets including Next.js resources, images, and common web files');

/**
 * Rate limit configuration
 */
export const middlewareRateLimitConfigSchema = z
  .object({
    windowMs: positiveInt
      .min(1000)
      .max(3600000)
      .describe('Time window in milliseconds for rate limiting (1 second to 1 hour)'), // 1 second to 1 hour
    maxRequests: positiveInt
      .max(10000)
      .describe('Maximum number of requests allowed within the time window'),
    skipFailedRequests: z
      .boolean()
      .optional()
      .describe('Whether to exclude failed requests from rate limit count'),
    skipSuccessfulRequests: z
      .boolean()
      .optional()
      .describe('Whether to exclude successful requests from rate limit count'),
  })
  .describe('Configuration options for rate limiting middleware behavior');

/**
 * Arcjet decision types
 */
const arcjetDecisionSchema = z
  .object({
    isDenied: z.function().describe('Function to check if the request was denied by Arcjet'),
    isAllowed: z.function().describe('Function to check if the request was allowed by Arcjet'),
    ip: z.string().describe('IP address that made the request'),
    reason: z
      .object({
        isRateLimit: z.function().describe('Function to check if denial was due to rate limiting'),
        isBot: z.function().describe('Function to check if denial was due to bot detection'),
        isShield: z.function().describe('Function to check if denial was due to shield protection'),
      })
      .describe('Detailed reason information for the Arcjet decision'),
    conclusion: z
      .enum(['ALLOW', 'DENY'])
      .describe('Final decision outcome from Arcjet security analysis'),
  })
  .describe('Arcjet security decision object containing authorization status and denial reasons');

/**
 * Request validation schema
 */
export const requestValidationSchema = z
  .object({
    method: httpMethodSchema.describe('HTTP method used for the request'),
    path: requestPathSchema.describe('URL path being requested'),
    userAgent: userAgentSchema.optional().describe('Browser or client user agent string'),
    ip: ipAddressSchema.optional().describe('Client IP address from headers or connection'),
    contentType: httpContentTypeSchema.optional().describe('Content type of the request body'),
    contentLength: nonNegativeInt
      .max(MIDDLEWARE_LIMITS.MAX_FORM_DATA_SIZE)
      .optional()
      .describe('Size of request body in bytes (max 1MB)'),
  })
  .describe(
    'Complete HTTP request validation including method, path, headers, and security checks'
  );

/**
 * Search query validation
 */
export const searchQueryValidationSchema = z
  .object({
    q: z
      .string()
      .max(MIDDLEWARE_LIMITS.MAX_SEARCH_QUERY_LENGTH)
      .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Invalid search query format')
      .optional()
      .describe('Search query string with alphanumeric and basic punctuation only (max 500 chars)'),
    category: z
      .enum(['all', 'agents', 'mcp', 'rules', 'commands', 'hooks', 'guides'])
      .optional()
      .describe('Content category to filter search results'),
    page: positiveInt
      .max(1000)
      .optional()
      .describe('Page number for paginated search results (max 1000)'),
    limit: positiveInt.max(100).optional().describe('Number of results per page (max 100)'),
  })
  .describe('Search query parameters with validation for query string, category, and pagination');

/**
 * API endpoint classification
 */
export const apiEndpointTypeSchema = z
  .enum(['admin', 'heavy_api', 'search', 'submit', 'api', 'static'])
  .describe('Classification of API endpoint type for rate limiting and security policies');

/**
 * Middleware response schema
 */
const middlewareResponseSchema = z
  .object({
    status: positiveInt.min(100).max(599).describe('HTTP status code for the response (100-599)'),
    headers: z
      .record(z.string().describe('Header name'), z.string().describe('Header value'))
      .describe('Response headers as key-value pairs'),
    body: z.string().optional().describe('Optional response body content'),
  })
  .describe('HTTP response structure for middleware including status, headers, and body');

/**
 * Security headers validation
 */
const securityHeadersSchema = z
  .object({
    'content-security-policy': z
      .string()
      .optional()
      .describe('CSP header to prevent XSS and injection attacks'),
    'strict-transport-security': z
      .string()
      .optional()
      .describe('HSTS header to enforce HTTPS connections'),
    'x-frame-options': z.string().optional().describe('Header to prevent clickjacking attacks'),
    'x-content-type-options': z
      .string()
      .optional()
      .describe('Header to prevent MIME type sniffing'),
    'x-xss-protection': z
      .string()
      .optional()
      .describe('Legacy XSS protection header for older browsers'),
    'referrer-policy': z
      .string()
      .optional()
      .describe('Header to control referrer information sent with requests'),
  })
  .describe('Collection of security-related HTTP headers for web application hardening');

/**
 * Helper to validate request data
 */
export function validateRequest(request: {
  method: string;
  url: string;
  headers: Record<string, string>;
}): z.infer<typeof requestValidationSchema> {
  const url = new URL(request.url);

  return requestValidationSchema.parse({
    method: request.method,
    path: url.pathname,
    userAgent: request.headers['user-agent'],
    ip: request.headers['x-forwarded-for'] || request.headers['x-real-ip'],
    contentType: request.headers['content-type'],
    contentLength: request.headers['content-length']
      ? Number.parseInt(request.headers['content-length'], 10)
      : undefined,
  });
}

/**
 * Helper to classify API endpoint type
 */
export function classifyApiEndpoint(
  path: string,
  method: string
): z.infer<typeof apiEndpointTypeSchema> {
  // Admin operations
  if (
    path.includes('/admin') ||
    path.includes('/manage') ||
    path.includes('/warm') ||
    path.includes('/cache/warm')
  ) {
    return 'admin';
  }

  // Heavy data operations
  if (
    path.includes('/bulk') ||
    path.includes('/export') ||
    path.includes('/all-') ||
    path.includes('/all-configurations')
  ) {
    return 'heavy_api';
  }

  // Search operations
  if (path.includes('/search') || path.includes('/find') || path.includes('/query')) {
    return 'search';
  }

  // Submit/modification operations
  if (
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ||
    path.includes('/submit') ||
    path.includes('/upload') ||
    path.includes('/create') ||
    path.includes('/update') ||
    path.includes('/delete')
  ) {
    return 'submit';
  }

  // Static assets
  if (staticAssetSchema.safeParse(path).success) {
    return 'static';
  }

  // Default API
  return 'api';
}

/**
 * Helper to validate search query parameters
 */
export function validateSearchQuery(
  searchParams: URLSearchParams
): z.infer<typeof searchQueryValidationSchema> {
  const params = {
    q: searchParams.get('q') || undefined,
    category: searchParams.get('category') || undefined,
    page: searchParams.get('page') ? Number.parseInt(searchParams.get('page')!, 10) : undefined,
    limit: searchParams.get('limit') ? Number.parseInt(searchParams.get('limit')!, 10) : undefined,
  };

  return searchQueryValidationSchema.parse(params);
}

/**
 * Helper to sanitize path for logging
 */
export function sanitizePathForLogging(path: string): string {
  // Remove sensitive information from path
  return path
    .replace(/\/api\/[^/]*\/[a-f0-9-]{36}/g, '/api/*/[UUID]') // Replace UUIDs
    .replace(/\/api\/[^/]*\/\d+/g, '/api/*/[ID]') // Replace numeric IDs
    .replace(/\?.*$/g, '') // Remove query parameters
    .slice(0, 200); // Limit length for logging
}

/**
 * Type exports
 */
export type HttpMethod = z.infer<typeof httpMethodSchema>;
export type RequestPath = z.infer<typeof requestPathSchema>;
export type IpAddress = z.infer<typeof ipAddressSchema>;
export type UserAgent = z.infer<typeof userAgentSchema>;
export type MiddlewareContentType = z.infer<typeof httpContentTypeSchema>;
export type MiddlewareRateLimitConfig = z.infer<typeof middlewareRateLimitConfigSchema>;
export type RequestValidation = z.infer<typeof requestValidationSchema>;
export type SearchQueryValidation = z.infer<typeof searchQueryValidationSchema>;
export type ApiEndpointType = z.infer<typeof apiEndpointTypeSchema>;
export type MiddlewareResponse = z.infer<typeof middlewareResponseSchema>;
export type SecurityHeaders = z.infer<typeof securityHeadersSchema>;
export type ArcjetDecision = z.infer<typeof arcjetDecisionSchema>;
