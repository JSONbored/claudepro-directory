'use client';

/**
 * Client-Side Fetch Retry Utility
 *
 * Provides a fetch wrapper with automatic retry logic for client-side operations.
 * Features:
 * - Exponential backoff
 * - Configurable retry count
 * - Only retries on network errors or 5xx server errors
 * - Does NOT retry on 4xx client errors (validation, auth, etc.)
 */

import { logClientError, logClientWarn } from '../logging/client.ts';

/**
 * Configuration for fetch retry behavior
 */
export interface FetchRetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Initial delay in milliseconds before first retry (default: 1000) */
  initialDelayMs: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: FetchRetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
};

/**
 * Fetch with automatic retry on network errors and 5xx server errors.
 *
 * This function will NOT retry on:
 * - 4xx client errors (these are typically user/validation errors)
 * - Successful responses (2xx)
 *
 * It WILL retry on:
 * - Network errors (fetch throws)
 * - 5xx server errors
 *
 * @param url - URL to fetch
 * @param options - Standard fetch options
 * @param config - Retry configuration
 * @param retriesRemaining - Internal counter for remaining retries
 * @returns Response from the fetch
 * @throws Error if all retries are exhausted
 *
 * @example
 * ```ts
 * const response = await fetchWithRetry(
 *   'https://api.example.com/data',
 *   {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ data: 'value' }),
 *   },
 *   { maxRetries: 3, initialDelayMs: 1000, backoffMultiplier: 2 }
 * );
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: FetchRetryConfig = DEFAULT_RETRY_CONFIG,
  retriesRemaining: number = config.maxRetries
): Promise<Response> {
  const attemptNumber = config.maxRetries - retriesRemaining + 1;

  try {
    const response = await fetch(url, options);

    // Don't retry on client errors (4xx) - these are user/validation errors
    if (!response.ok && response.status >= 400 && response.status < 500) {
      return response;
    }

    // Retry on server errors (5xx)
    if (!response.ok && response.status >= 500 && retriesRemaining > 0) {
      const delay =
        config.initialDelayMs *
        Math.pow(config.backoffMultiplier, config.maxRetries - retriesRemaining);

      logClientWarn(
        `fetchWithRetry: server error ${response.status}, retrying after ${delay}ms`,
        undefined,
        'fetchWithRetry',
        {
          url: sanitizeUrl(url),
          status: response.status,
          attempt: attemptNumber,
          retriesRemaining,
          delay,
        }
      );

      await sleep(delay);
      return fetchWithRetry(url, options, config, retriesRemaining - 1);
    }

    return response;
  } catch (error) {
    // Retry on network errors
    if (retriesRemaining > 0) {
      const delay =
        config.initialDelayMs *
        Math.pow(config.backoffMultiplier, config.maxRetries - retriesRemaining);

      logClientWarn(
        `fetchWithRetry: network error, retrying after ${delay}ms`,
        error,
        'fetchWithRetry',
        {
          url: sanitizeUrl(url),
          attempt: attemptNumber,
          retriesRemaining,
          delay,
        }
      );

      await sleep(delay);
      return fetchWithRetry(url, options, config, retriesRemaining - 1);
    }

    // All retries exhausted
    logClientError('fetchWithRetry: all retries exhausted', error, 'fetchWithRetry', {
      url: sanitizeUrl(url),
      totalAttempts: config.maxRetries + 1,
    });

    throw error;
  }
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sanitize URL for logging (remove sensitive query params)
 */
function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove common sensitive params
    const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
    for (const param of sensitiveParams) {
      if (parsed.searchParams.has(param)) {
        parsed.searchParams.set(param, '[REDACTED]');
      }
    }
    return parsed.toString();
  } catch {
    // If URL parsing fails, just return a safe version
    return url.split('?')[0] ?? url;
  }
}
