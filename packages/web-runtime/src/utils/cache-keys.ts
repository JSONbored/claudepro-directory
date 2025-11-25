/**
 * Cache Key Utilities
 * 
 * Provides deterministic serialization and sanitization for cache keys to ensure
 * consistent cache behavior and prevent cache poisoning attacks.
 */

/**
 * Sanitize a string for use in cache keys
 * 
 * Removes or replaces characters that could be used for cache key injection.
 * Only allows alphanumeric characters, hyphens, underscores, and dots.
 * 
 * @param input - The string to sanitize
 * @returns A sanitized string safe for use in cache keys
 */
export function sanitizeCacheKey(input: string): string {
  // Remove any characters that aren't alphanumeric, hyphen, underscore, or dot
  // This prevents cache key injection attacks
  return input.replace(/[^a-zA-Z0-9\-_.]/g, '').slice(0, 200); // Max 200 chars
}

/**
 * Sanitize an array of strings for use in cache keys
 * 
 * @param inputs - Array of strings to sanitize and join
 * @param separator - Separator to use when joining (default: '-')
 * @returns A sanitized string safe for use in cache keys
 */
export function sanitizeCacheKeyArray(inputs: readonly string[], separator = '-'): string {
  return inputs.map(sanitizeCacheKey).filter(Boolean).join(separator) || 'all';
}

/**
 * Deterministically stringify an object for use in cache keys
 * 
 * Sorts object keys before stringifying to ensure consistent cache keys
 * regardless of the order properties were added to the object.
 * Also sanitizes string values to prevent cache key injection.
 * 
 * @param obj - The object to stringify
 * @returns A deterministic JSON string representation
 * 
 * @example
 * ```ts
 * // These produce the same cache key:
 * deterministicStringify({ a: 1, b: 2 })
 * deterministicStringify({ b: 2, a: 1 })
 * ```
 */
export function deterministicStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }
  
  if (typeof obj === 'string') {
    // Sanitize string inputs to prevent cache key injection
    return sanitizeCacheKey(obj);
  }
  
  if (typeof obj !== 'object') {
    // For primitives, convert to string and sanitize
    return sanitizeCacheKey(String(obj));
  }
  
  if (Array.isArray(obj)) {
    return `[${obj.map(deterministicStringify).join(',')}]`;
  }
  
  // Sort keys to ensure deterministic output
  // Also sanitize string values in the object
  const sorted = Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      const value = obj[key as keyof typeof obj];
      // Sanitize object keys and string values
      const sanitizedKey = sanitizeCacheKey(key);
      if (sanitizedKey) {
        acc[sanitizedKey] = typeof value === 'string' ? sanitizeCacheKey(value) : value;
      }
      return acc;
    }, {} as Record<string, unknown>);
  
  return JSON.stringify(sorted);
}
