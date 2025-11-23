'use client';

import { logger } from '../logger.ts';
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
    const error = new Error('Authentication required');
    logger.error('No auth token available for Edge function', error, { functionName });
    throw error;
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
    logger.error('Edge function error', errorText, {
      functionName,
      status: response.status,
      method,
    });

    try {
      const error = JSON.parse(errorText);
      throw new Error(error.message || `Edge function ${functionName} failed`);
    } catch {
      throw new Error(`Edge function ${functionName} failed: ${response.status}`);
    }
  }

  return response.json();
}
