/**
 * Input validation and sanitization utilities
 * Prevents injection attacks and validates user input
 */

const MAX_QUERY_STRING_LENGTH = 2048;
const MAX_PATH_SEGMENT_LENGTH = 255;
const MAX_ROUTE_LENGTH = 2048;

/**
 * Validate and sanitize query string
 */
export function validateQueryString(url: URL): { valid: boolean; error?: string } {
  const queryString = url.search;
  if (queryString.length > MAX_QUERY_STRING_LENGTH) {
    return {
      valid: false,
      error: `Query string too long (max ${MAX_QUERY_STRING_LENGTH} characters)`,
    };
  }

  // Check for suspicious patterns
  if (/[<>]/.test(queryString)) {
    return {
      valid: false,
      error: 'Query string contains invalid characters',
    };
  }

  return { valid: true };
}

/**
 * Validate and sanitize path segments
 */
export function validatePathSegments(segments: string[]): { valid: boolean; error?: string } {
  for (const segment of segments) {
    if (segment.length > MAX_PATH_SEGMENT_LENGTH) {
      return {
        valid: false,
        error: `Path segment too long (max ${MAX_PATH_SEGMENT_LENGTH} characters)`,
      };
    }

    // Check for path traversal attempts
    if (segment.includes('..') || segment.includes('//')) {
      return {
        valid: false,
        error: 'Invalid path segment',
      };
    }

    // Check for suspicious characters
    if (/[<>"']/.test(segment)) {
      return {
        valid: false,
        error: 'Path segment contains invalid characters',
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitize route parameter
 */
export function sanitizeRoute(route: string): string {
  // Remove any null bytes
  let sanitized = route.replace(/\0/g, '');

  // Remove path traversal attempts
  sanitized = sanitized.replace(/\.\./g, '');

  // Remove double slashes
  sanitized = sanitized.replace(/\/\/+/g, '/');

  // Ensure it starts with /
  if (!sanitized.startsWith('/')) {
    sanitized = `/${sanitized}`;
  }

  // Limit length
  if (sanitized.length > MAX_ROUTE_LENGTH) {
    sanitized = sanitized.slice(0, MAX_ROUTE_LENGTH);
  }

  return sanitized;
}

/**
 * Validate category parameter
 */
export function validateCategory(
  category: string | null,
  validCategories: readonly string[]
): { valid: boolean; error?: string; category?: string } {
  if (!category) {
    return { valid: true };
  }

  const normalized = category.toLowerCase().trim();
  if (!validCategories.includes(normalized)) {
    return {
      valid: false,
      error: `Invalid category. Valid categories: ${validCategories.join(', ')}`,
    };
  }

  return { valid: true, category: normalized };
}

/**
 * Validate limit parameter
 */
export function validateLimit(
  limit: string | null,
  min = 1,
  max = 100,
  defaultValue = 10
): { valid: boolean; error?: string; limit?: number } {
  if (!limit) {
    return { valid: true, limit: defaultValue };
  }

  const parsed = Number.parseInt(limit, 10);
  if (Number.isNaN(parsed)) {
    return {
      valid: false,
      error: `Limit must be a number between ${min} and ${max}`,
    };
  }

  if (parsed < min || parsed > max) {
    return {
      valid: false,
      error: `Limit must be between ${min} and ${max}`,
    };
  }

  return { valid: true, limit: parsed };
}

/**
 * Request body size limits (in bytes)
 */
export const MAX_BODY_SIZE = {
  webhook: 1024 * 1024, // 1MB for webhooks
  dismiss: 10 * 1024, // 10KB for dismiss (notification IDs only)
  discord: 100 * 1024, // 100KB for Discord payloads
  default: 100 * 1024, // 100KB default
} as const;

/**
 * Validate request body size
 * Note: This should be called before reading the body
 */
export function validateBodySize(
  contentLength: string | null,
  maxSize: number = MAX_BODY_SIZE.default
): { valid: boolean; error?: string } {
  if (!contentLength) {
    // If no Content-Length header, we'll check after reading (less efficient but works)
    return { valid: true };
  }

  const size = Number.parseInt(contentLength, 10);
  if (Number.isNaN(size)) {
    return {
      valid: false,
      error: 'Invalid Content-Length header',
    };
  }

  if (size > maxSize) {
    return {
      valid: false,
      error: `Request body too large (max ${maxSize} bytes)`,
    };
  }

  return { valid: true };
}
