import { getServiceRoleConfig, getSupabaseUrl } from './supabase.js';

export interface EdgeFetchOptions {
  timeoutMs?: number;
  responseType?: 'json' | 'text';
  requireAuth?: boolean;
}

export async function callEdgeFunction<T = unknown>(
  path: string,
  init: RequestInit = {},
  options: EdgeFetchOptions = {}
): Promise<T> {
  const supabaseUrl = getSupabaseUrl();
  const requireAuth = options.requireAuth ?? true;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const responseType = options.responseType ?? 'json';

  let serviceRoleKey: string | undefined;
  if (requireAuth) {
    ({ serviceRoleKey } = getServiceRoleConfig());
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(init.headers ?? {});
  if (requireAuth && serviceRoleKey && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${serviceRoleKey}`);
  }

  const url = path.startsWith('http')
    ? path
    : `${supabaseUrl.replace(/\/$/, '')}/functions/v1${path.startsWith('/') ? path : `/${path}`}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Edge function request failed (${response.status} ${response.statusText}): ${errorText}`
      );
    }

    if (responseType === 'text') {
      return (await response.text()) as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    // Import logger dynamically to avoid circular dependencies
    const { logger } = await import('./logger.ts');
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    if (errorObj.name === 'AbortError') {
      const timeoutError = new Error(`Edge function request timed out after ${timeoutMs}ms`);
      // Use Pino logger for consistent structured logging
      logger.error('Edge function timeout', timeoutError, {
        path,
        timeoutMs,
      });
      throw timeoutError;
    }
    // Log other errors using Pino
    logger.error('Edge function request failed', errorObj, {
      path,
    });
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
