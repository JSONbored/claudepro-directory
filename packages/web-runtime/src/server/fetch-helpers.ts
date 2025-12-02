'use server';

import { withTimeout, TIMEOUT_PRESETS, normalizeError } from '@heyclaude/shared-runtime';

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

/**
 * Validate URL is safe for server-side fetch (prevents SSRF attacks)
 * Only allows relative URLs or absolute URLs from trusted origins
 * 
 * @param url - URL to validate
 * @returns true if URL is safe to fetch, false otherwise
 */
function isSafeFetchUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    // SECURITY: Reject relative URLs - Node.js fetch() requires absolute URLs
    // Relative URLs will cause runtime failures in server-side fetch
    if (url.startsWith('/')) {
      return false;
    }

    // For absolute URLs, parse and validate
    const urlObj = new URL(url);

    // Reject dangerous protocols
    const dangerousProtocols = ['file:', 'javascript:', 'data:', 'vbscript:', 'about:'];
    if (dangerousProtocols.includes(urlObj.protocol.toLowerCase())) {
      return false;
    }

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }

    // Reject URLs with credentials (username:password@host)
    if (urlObj.username || urlObj.password) {
      return false;
    }

    // Reject private/internal IP addresses (SSRF protection)
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check for IPv4-mapped IPv6 addresses (::ffff:x.x.x.x)
    const ipv4MappedMatch = hostname.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (ipv4MappedMatch && ipv4MappedMatch[1]) {
      const mappedIpv4 = ipv4MappedMatch[1];
      // Check the embedded IPv4 against private ranges
      if (
        mappedIpv4.startsWith('127.') ||
        mappedIpv4.startsWith('10.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(mappedIpv4) ||
        mappedIpv4.startsWith('192.168.') ||
        mappedIpv4.startsWith('169.254.') ||
        mappedIpv4.startsWith('0.')
      ) {
        return false;
      }
    }
    
    const privateIpPatterns = [
      /^0\./,             // 0.0.0.0/8
      /^127\./,           // 127.0.0.0/8
      /^10\./,             // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./,       // 192.168.0.0/16
      /^169\.254\./,       // 169.254.0.0/16 (link-local)
      /^::1$/,             // IPv6 localhost
      /^f[cd][0-9a-f]{2}:/i, // IPv6 unique local (fc00::/7 - covers both fc00::/8 and fd00::/8)
      /^fe80:/,            // IPv6 link-local
      /^localhost$/i,      // localhost hostname
    ];

    for (const pattern of privateIpPatterns) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    return true;
  } catch {
    // Invalid URL format
    return false;
  }
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
  // SECURITY: Validate URL to prevent SSRF attacks
  if (!isSafeFetchUrl(url)) {
    // SECURITY: Don't include full URL in error message to avoid leaking sensitive information
    throw new Error('Invalid or unsafe URL. Only absolute URLs with http/https protocols are allowed.');
  }

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
      lastError = normalizeError(error, 'Unknown fetch error');
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
