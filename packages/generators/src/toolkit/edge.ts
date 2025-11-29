import { normalizeError } from '@heyclaude/shared-runtime';

import { logger } from './logger.js';
import { getServiceRoleConfig, getSupabaseUrl } from './supabase.js';

export interface EdgeFetchOptions {
  requireAuth?: boolean;
  responseType?: 'json' | 'text';
  timeoutMs?: number;
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
    const errorObj = normalizeError(error, 'Edge function call failed');
    
    if (errorObj.name === 'AbortError') {
      const timeoutError = new Error(`Edge function request timed out after ${timeoutMs}ms`);
      logger.error('Edge function timeout', timeoutError, {
        command: 'edge',
        path,
        timeoutMs,
      });
      throw timeoutError;
    }
    logger.error('Edge function request failed', errorObj, {
      command: 'edge',
      path,
    });
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
