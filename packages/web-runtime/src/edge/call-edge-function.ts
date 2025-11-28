'use client';

import { logger, normalizeError } from '../entries/core.ts';
import { createSupabaseBrowserClient } from '../supabase/browser.ts';
import { getEnvVar } from '@heyclaude/shared-runtime';

interface EdgeCallOptions {
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
  requireAuth?: boolean;
}

const getEdgeBaseUrl = () => {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  }
  return `${supabaseUrl}/functions/v1`;
};

export async function callEdgeFunction<T = unknown>(
  functionName: string,
  options: EdgeCallOptions = {}
): Promise<T> {
  const { method = 'POST', body, requireAuth = false } = options;

  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token =
    session?.access_token || (requireAuth ? null : getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'));

  if (!token && requireAuth) {
    const normalized = normalizeError(new Error('Authentication required'), 'No auth token available for Edge function');
    logger.error('No auth token available for Edge function', normalized, { functionName });
    throw normalized;
  }

  const response = await fetch(`${getEdgeBaseUrl()}/${functionName}`, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const normalized = normalizeError(
      new Error(`Edge function ${functionName} failed: ${response.status} ${response.statusText}`),
      'Edge function error'
    );
    logger.error('Edge function error', normalized, {
      functionName,
      status: response.status,
      method,
      responseBody: errorText,
    });

    try {
      const parsedError = JSON.parse(errorText);
      throw new Error(parsedError.message || `Edge function ${functionName} failed`);
    } catch {
      throw new Error(`Edge function ${functionName} failed: ${response.status}`);
    }
  }

  return response.json();
}
