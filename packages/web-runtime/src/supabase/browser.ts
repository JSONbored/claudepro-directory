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

    // Type assertion: Mock client for development when env vars are missing
    // This mock object doesn't match the full Supabase client interface, but provides
    // the minimal structure needed to prevent runtime errors in development
    // The 'as unknown as' pattern is necessary because the mock is intentionally incomplete
    const mockClient = {
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
    
    return mockClient;
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
