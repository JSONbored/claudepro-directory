/**
 * Supabase Browser Client
 * Used in Client Components for browser-side operations
 *
 * Security: Uses anon key (safe for client-side)
 * RLS policies enforce data access rules
 */

import { createBrowserClient } from '@supabase/ssr';
import { logger } from '@/src/lib/logger';
import type { Database } from '@/src/types/database.types';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // In development without env vars, return a mock client that won't crash
  if (!(supabaseUrl && supabaseAnonKey)) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn(
        'Supabase env vars not found - using mock browser client for development. Auth features will not work.'
      );
      // Return a mock client that matches the Supabase client interface
      return {
        auth: {
          getUser: async () => ({ data: { user: null }, error: null }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({
            data: {
              subscription: {
                // biome-ignore lint/suspicious/noEmptyBlockStatements: Mock unsubscribe function for development
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
      } as unknown as ReturnType<typeof createBrowserClient<Database>>;
    }
    throw new Error(
      'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
