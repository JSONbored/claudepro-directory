export interface FetchWithRetryOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
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

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 1000;

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
      const response = await fetch(url, {
        method,
        headers,
        body,
      });

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
        url,
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
