'use server';

import { withTimeout, TIMEOUT_PRESETS } from '@heyclaude/shared-runtime';

export interface FetchWithRetryOptions {
  url: string;
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  retry?: {
    attempts?: number;
    baseDelayMs?: number;
    retryOn?: number[];
    noRetryOn?: number[];
  };
}

export interface FetchWithRetryResult {
  response: Response;
  retryCount: number;
}

const DEFAULT_ATTEMPTS = 2;
const DEFAULT_BASE_DELAY_MS = 1000;

function shouldRetry(status: number, retryOn?: number[], noRetryOn?: number[]): boolean {
  if (noRetryOn && noRetryOn.includes(status)) {
    return false;
  }
  if (retryOn && retryOn.includes(status)) {
    return true;
  }
  return status >= 500 && status < 600;
}

export async function fetchWithRetry({
  url,
  method = 'GET',
  headers,
  body,
  retry,
}: FetchWithRetryOptions): Promise<FetchWithRetryResult> {
  const attempts = retry?.attempts ?? DEFAULT_ATTEMPTS;
  const baseDelay = retry?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const retryOn = retry?.retryOn;
  const noRetryOn = retry?.noRetryOn;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= attempts; attempt++) {
    try {
      const requestInit: RequestInit = {
        method,
      };
      if (headers !== undefined) {
        requestInit.headers = headers;
      }
      if (body !== undefined) {
        requestInit.body = body;
      }

      const response = await fetch(url, requestInit);

      if (response.ok) {
        return { response, retryCount: attempt };
      }

      if (!shouldRetry(response.status, retryOn, noRetryOn)) {
        const text = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const text = await response.text().catch(() => '');
      lastError = new Error(`HTTP ${response.status}: ${text}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown fetch error');
    }

    if (attempt < attempts) {
      const delay = baseDelay * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('fetchWithRetry exceeded attempts');
}

export async function fetchWithRetryAndTimeout(
  options: FetchWithRetryOptions,
  timeoutMs: number = TIMEOUT_PRESETS.external
): Promise<FetchWithRetryResult> {
  return withTimeout(fetchWithRetry(options), timeoutMs, 'Fetch request timed out');
}
