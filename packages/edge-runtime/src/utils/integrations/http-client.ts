import { createUtilityContext } from '@heyclaude/shared-runtime';

export interface FetchWithRetryOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  retry?: {
    attempts?: number;
    baseDelayMs?: number;
    retryOn?: number[];
    noRetryOn?: number[];
  };
  logContext?: ReturnType<typeof createUtilityContext>;
}

export interface FetchWithRetryResult {
  response: Response;
  retryCount: number;
}

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 1000;

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  onRetry?: (attempt: number, error: Error, delay: number) => void;
  logContext?: ReturnType<typeof createUtilityContext>;
}

export async function fetchWithRetry({
  url,
  method = 'GET',
  headers,
  body,
  retry,
  logContext,
}: FetchWithRetryOptions): Promise<FetchWithRetryResult> {
  const attempts = retry?.attempts ?? DEFAULT_ATTEMPTS;
  const baseDelay = retry?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const retryOn = retry?.retryOn;
  const noRetryOn = retry?.noRetryOn;

  const context = logContext ?? createUtilityContext('fetchWithRetry', 'fetch', { url, method });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= attempts; attempt++) {
    try {
      const fetchOptions: {
        method: string;
        headers?: Record<string, string>;
        body?:
          | string
          | Blob
          | ArrayBufferView
          | ArrayBuffer
          | FormData
          | URLSearchParams
          | ReadableStream<Uint8Array>;
      } = {
        method,
        ...(headers !== undefined ? { headers } : {}),
      };
      if (body !== null && body !== undefined) {
        // Type assertion needed because body is unknown, but we validate it's a valid BodyInit type at runtime
        fetchOptions.body = body as
          | string
          | Blob
          | ArrayBufferView
          | ArrayBuffer
          | FormData
          | URLSearchParams
          | ReadableStream<Uint8Array>;
      }
      // Type assertion to satisfy fetch's RequestInit type requirements
      const response = await fetch(url, fetchOptions as Parameters<typeof fetch>[1]);

      if (response.ok) {
        return { response, retryCount: attempt };
      }

      if (!shouldRetry(response.status, retryOn, noRetryOn)) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      lastError = new Error(`HTTP ${response.status}: ${await response.text()}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown fetch error');
    }

    if (attempt < attempts) {
      const delay = baseDelay * 2 ** attempt;
      console.warn('[fetchWithRetry] retrying request', {
        ...context,
        attempt: attempt + 1,
        attempts,
        delay,
        lastError: lastError?.message,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('fetchWithRetry exceeded attempts');
}

export async function runWithRetry<T>(
  fn: () => Promise<T>,
  {
    attempts = DEFAULT_ATTEMPTS,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    onRetry,
    logContext,
  }: RetryOptions = {}
): Promise<T> {
  const context = logContext ?? createUtilityContext('runWithRetry', 'retry');
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown retry error');
    }

    if (attempt < attempts) {
      const delay = baseDelayMs * 2 ** attempt;
      const errorForRetry = lastError ?? new Error('Unknown retry error');
      if (onRetry) {
        onRetry(attempt + 1, errorForRetry, delay);
      } else {
        console.warn('[runWithRetry] retrying operation', {
          ...context,
          attempt: attempt + 1,
          attempts,
          delay,
          lastError: errorForRetry.message,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('runWithRetry exceeded attempts');
}

function shouldRetry(status: number, retryOn?: number[], noRetryOn?: number[]): boolean {
  if (noRetryOn?.includes(status)) {
    return false;
  }

  if (retryOn?.length) {
    return retryOn.includes(status);
  }

  // Default: retry on 5xx, network errors handled separately
  return status >= 500;
}
