/**
 * Supabase Admin Client
 * Used for admin operations that bypass RLS
 *
 * WARNING: Use sparingly and carefully
 * - Server-side only (never expose to client)
 * - Bypasses all RLS policies
 * - Use for: cron jobs, webhooks, admin operations
 *
 * Examples: Sending emails to users, bulk operations, system tasks
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database.types';

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // In local environments without env vars, return a mock client that won't crash
  // This allows local dev AND local builds to succeed without Supabase
  if (!(supabaseUrl && supabaseServiceKey)) {
    const isLocal = !(process.env.VERCEL || process.env.CI);
    if (isLocal) {
      // biome-ignore lint/suspicious/noConsole: Intentional development warning for missing Supabase credentials
      console.warn(
        '⚠️  Supabase admin env vars not found - using mock admin client (local environment). Admin features will not work.'
      );
      // Return a mock admin client that matches the Supabase client interface
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
          admin: {
            listUsers: async () => ({ data: { users: [] }, error: null }),
            getUserById: async () => ({ data: { user: null }, error: null }),
            updateUserById: async () => ({ data: { user: null }, error: null }),
            deleteUser: async () => ({ data: null, error: null }),
          },
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
      } as unknown as ReturnType<typeof createSupabaseClient<Database>>;
    }
    throw new Error(
      'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
