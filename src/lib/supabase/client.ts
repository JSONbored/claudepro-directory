/**
 * Supabase Browser Client
 * Used in Client Components for browser-side operations
 *
 * Security: Uses anon key (safe for client-side)
 * RLS policies enforce data access rules
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/src/types/database.types';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // In local environments without env vars, return a mock client that won't crash
  // This allows local dev AND local builds to succeed without Supabase
  // FIXED: Use VERCEL/CI check instead of NODE_ENV (which is 'production' during build)
  if (!(supabaseUrl && supabaseAnonKey)) {
    const isLocal = !(process.env.VERCEL || process.env.CI);
    if (isLocal) {
      // biome-ignore lint/suspicious/noConsole: Intentional development warning for missing Supabase credentials
      console.warn(
        '⚠️  Supabase env vars not found - using mock client (local environment). Auth features will not work.'
      );
      // Return a mock client that matches the Supabase client interface
      // Create chainable query builder
      const createChainableQuery = (): any => ({
        eq: () => createChainableQuery(),
        neq: () => createChainableQuery(),
        gt: () => createChainableQuery(),
        gte: () => createChainableQuery(),
        lt: () => createChainableQuery(),
        lte: () => createChainableQuery(),
        like: () => createChainableQuery(),
        ilike: () => createChainableQuery(),
        is: () => createChainableQuery(),
        in: () => createChainableQuery(),
        contains: () => createChainableQuery(),
        containedBy: () => createChainableQuery(),
        order: () => createChainableQuery(),
        limit: () => createChainableQuery(),
        range: () => createChainableQuery(),
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
        then: async () => ({ data: [], error: null }),
      });

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
          select: () => createChainableQuery(),
          insert: async () => ({ data: null, error: null }),
          update: () => createChainableQuery(),
          delete: () => createChainableQuery(),
          upsert: async () => ({ data: null, error: null }),
        }),
        rpc: async () => ({ data: null, error: null }),
        storage: {
          from: () => ({
            upload: async () => ({ data: null, error: null }),
            download: async () => ({ data: null, error: null }),
            remove: async () => ({ data: null, error: null }),
            list: async () => ({ data: [], error: null }),
          }),
        },
      } as unknown as ReturnType<typeof createBrowserClient<Database>>;
    }
    throw new Error(
      'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
