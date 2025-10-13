/**
 * Supabase Server Client
 * Used in Server Components, Server Actions, and Route Handlers
 *
 * Handles cookies automatically for auth session management
 * Uses anon key + RLS for user-level access
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/src/types/database.types';

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // In development without env vars, return a mock client that won't crash
  if (!(supabaseUrl && supabaseAnonKey)) {
    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint/suspicious/noConsole: Intentional development warning for missing Supabase credentials
      console.warn(
        '⚠️  Supabase env vars not found - using mock server client for development. Database features will not work.'
      );
      // Return a mock client that matches the Supabase client interface
      return {
        auth: {
          getUser: async () => ({ data: { user: null }, error: null }),
          signOut: async () => ({ error: null }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: null }),
              maybeSingle: async () => ({ data: null, error: null }),
            }),
            order: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
            limit: async () => ({ data: [], error: null }),
          }),
          insert: async () => ({ data: null, error: null }),
          update: async () => ({ data: null, error: null }),
          delete: async () => ({ data: null, error: null }),
        }),
      } as unknown as ReturnType<typeof createServerClient<Database>>;
    }
    throw new Error(
      'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
