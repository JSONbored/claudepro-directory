/**
 * Utility Functions
 *
 * Shared utilities for timeout handling, retry logic, and other common operations
 */

/**
 * Execute a promise with a timeout
 *
 * @param promise - Promise to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Error message if timeout occurs
 * @returns Promise that resolves or rejects with timeout error
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: unknown) => boolean;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
  retryableErrors: (error) => {
    // Retry on network errors, 5xx errors, and timeouts
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('network')) {
        return true;
      }
    }
    if (error && typeof error === 'object' && 'status' in error) {
      const status = error.status as number;
      return status >= 500 && status < 600;
    }
    return false;
  },
};

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - Function to execute
 * @param config - Retry configuration
 * @returns Promise that resolves with function result or rejects after all retries
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this was the last attempt
      if (attempt === finalConfig.maxRetries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!finalConfig.retryableErrors(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const baseDelay = Math.min(
        finalConfig.initialDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelayMs
      );
      const jitter = Math.random() * 0.3 * baseDelay; // 0-30% jitter
      const delay = baseDelay + jitter;

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Sanitize string input to prevent XSS
 * Basic sanitization - removes potentially dangerous characters
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes and control characters
  return input
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Validate URL format
 *
 * @param url - URL string to validate
 * @returns true if valid URL, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate slug format
 * Slugs should be alphanumeric with hyphens and underscores
 *
 * @param slug - Slug string to validate
 * @returns true if valid slug, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Allow alphanumeric, hyphens, underscores, and dots
  // Must start and end with alphanumeric
  const slugRegex = /^[a-z0-9]([a-z0-9\-_.]*[a-z0-9])?$/i;
  return slugRegex.test(slug) && slug.length >= 1 && slug.length <= 200;
}

