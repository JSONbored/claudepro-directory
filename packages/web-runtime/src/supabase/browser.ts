/**
 * Supabase Browser Client
 * Safe for client components (uses anon key + RLS enforcement).
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@heyclaude/database-types';
import { logger } from '../logger.ts';

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient<Database>>;

export function createSupabaseBrowserClient(): SupabaseBrowserClient {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!(supabaseUrl && supabaseAnonKey)) {
  if (process.env['NODE_ENV'] === 'development') {
      logger.warn(
        'Supabase env vars not found - using mock browser client for development. Auth features will not work.'
      );
    }

    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
        signInWithOAuth: async () => ({ error: new Error('Supabase client not configured') }),
        onAuthStateChange: () => ({
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseBrowserClient;
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
