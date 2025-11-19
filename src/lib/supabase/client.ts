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
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  // If env vars are missing, return a mock client (never throw)
  // This allows builds to succeed even when env vars aren't available
  // Client components handle missing auth gracefully
  if (!(supabaseUrl && supabaseAnonKey)) {
    // Only log in development, not during build (to reduce noise)
    if (process.env.NODE_ENV === 'development') {
      logger.warn(
        'Supabase env vars not found - using mock browser client for development. Auth features will not work.'
      );
    }
    // Return a mock client that matches the Supabase client interface
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
        signInWithOAuth: async () => ({ error: new Error('Supabase client not configured') }),
        onAuthStateChange: () => ({
          data: {
            subscription: {
              // biome-ignore lint/suspicious/noEmptyBlockStatements: Mock unsubscribe function
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

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
