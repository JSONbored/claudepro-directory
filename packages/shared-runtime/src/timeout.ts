/**
 * Timeout utilities for async operations
 * Prevents hanging requests and resource exhaustion
 */

export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly timeoutMs: number
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  // Handle invalid timeout values (NaN, non-finite, zero or negative)
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return Promise.reject(
      new TimeoutError(
        errorMessage || `Invalid timeout value: ${timeoutMs}ms (must be a positive finite number)`,
        timeoutMs
      )
    );
  }

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(
          new TimeoutError(errorMessage ?? `Operation timed out after ${timeoutMs}ms`, timeoutMs)
        );
      }
    }, timeoutMs);
    
    promise.then(
      (result) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          resolve(result);
        }
      },
      (error) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          reject(error);
        }
      }
    );
  });
}

/**
 * Default timeout presets
 */
export const TIMEOUT_PRESETS = Object.freeze({
  rpc: 30_000, // 30 seconds for database RPC calls
  external: 10_000, // 10 seconds for external API calls
  storage: 15_000, // 15 seconds for storage operations
} as const);
