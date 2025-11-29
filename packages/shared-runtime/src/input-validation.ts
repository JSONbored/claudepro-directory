const MAX_QUERY_STRING_LENGTH = 2048;
const MAX_PATH_SEGMENT_LENGTH = 255;
const MAX_ROUTE_LENGTH = 2048;

export function validateQueryString(url: URL): { error?: string; valid: boolean; } {
  const queryString = url.search;
  if (queryString.length > MAX_QUERY_STRING_LENGTH) {
    return {
      valid: false,
      error: `Query string too long (max ${MAX_QUERY_STRING_LENGTH} characters)`,
    };
  }

  if (/[<>]/.test(queryString)) {
    return {
      valid: false,
      error: 'Query string contains invalid characters',
    };
  }

  return { valid: true };
}

export function validatePathSegments(segments: string[]): { error?: string; valid: boolean; } {
  for (const segment of segments) {
    if (segment.length > MAX_PATH_SEGMENT_LENGTH) {
      return {
        valid: false,
        error: `Path segment too long (max ${MAX_PATH_SEGMENT_LENGTH} characters)`,
      };
    }

    if (segment.includes('..') || segment.includes('//')) {
      return {
        valid: false,
        error: 'Invalid path segment',
      };
    }

    if (/[<>"']/.test(segment)) {
      return {
        valid: false,
        error: 'Path segment contains invalid characters',
      };
    }
  }

  return { valid: true };
}

export function sanitizeRoute(route: string): string {
  let sanitized = route.replaceAll('\0', '');
  sanitized = sanitized.replaceAll('..', '');
  sanitized = sanitized.replaceAll(/\/\/+/g, '/');

  if (!sanitized.startsWith('/')) {
    sanitized = `/${sanitized}`;
  }

  if (sanitized.length > MAX_ROUTE_LENGTH) {
    sanitized = sanitized.slice(0, MAX_ROUTE_LENGTH);
  }

  return sanitized;
}

export function validateCategory(
  category: null | string,
  validCategories: readonly string[]
): { category?: string; error?: string; valid: boolean; } {
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

export function validateLimit(
  limit: null | string,
  min = 1,
  max = 100,
  defaultValue = 10
): { error?: string; limit?: number; valid: boolean; } {
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

export const MAX_BODY_SIZE = {
  webhook: 1024 * 1024,
  dismiss: 10 * 1024,
  discord: 100 * 1024,
  default: 100 * 1024,
} as const;

export function validateBodySize(
  contentLength: null | string,
  maxSize: number = MAX_BODY_SIZE.default
): { error?: string; valid: boolean; } {
  if (!contentLength) {
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

export function validateSlug(slug: string): { error?: string; valid: boolean; } {
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      valid: false,
      error: 'Invalid slug format. Only lowercase letters, numbers, and hyphens allowed.',
    };
  }
  return { valid: true };
}
