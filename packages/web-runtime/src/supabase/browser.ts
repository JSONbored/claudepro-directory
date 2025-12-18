/**
 * Supabase Browser Client
 * Safe for client components (uses anon key + RLS enforcement).
 */

import { env } from '@heyclaude/shared-runtime/schemas/env';

import { createBrowserClient } from '@supabase/ssr';

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;

export function createSupabaseBrowserClient(): SupabaseBrowserClient {
  try {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
        'Please ensure Infisical dev environment contains NEXT_PUBLIC_SUPABASE_URL, ' +
        'or set it in your environment variables.'
      );
    }

    if (!supabaseAnonKey) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
        'Please ensure Infisical dev environment contains NEXT_PUBLIC_SUPABASE_ANON_KEY, ' +
        'or set it in your environment variables.'
      );
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    // In production, log but don't crash - return a mock client that will fail gracefully
    if (typeof window !== 'undefined') {
      console.error('[Supabase] Failed to create browser client:', error);
    }
    throw error; // Re-throw to let calling code handle it
  }
}
