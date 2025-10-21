/**
 * Supabase Server Client
 * Used in Server Components, Server Actions, and Route Handlers
 *
 * Handles cookies automatically for auth session management
 * Uses anon key + RLS for user-level access
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger } from '@/src/lib/logger';
import type { Database } from '@/src/types/database.types';

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // In local environments without env vars, return a mock client that won't crash
  // This allows local dev AND local builds to succeed without Supabase
  if (!(supabaseUrl && supabaseAnonKey)) {
    const isLocal = !(process.env.VERCEL || process.env.CI);
    if (isLocal) {
      // biome-ignore lint/suspicious/noConsole: Intentional development warning for missing Supabase credentials
      console.warn(
        '⚠️  Supabase env vars not found - using mock server client (local environment). Database features will not work.'
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
      } as unknown as ReturnType<typeof createServerClient<Database>>;
    }
    throw new Error(
      'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookies = cookieStore.getAll();
        logger.info('Supabase getting cookies', {
          count: cookies.length,
          names: cookies.map((c) => c.name).join(', '),
        });
        return cookies;
      },
      setAll(cookiesToSet) {
        try {
          logger.info('Supabase setting cookies', {
            count: cookiesToSet.length,
          });

          // Trust Supabase's cookie options - don't override
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch (error) {
          // CRITICAL: Only ignore errors from Server Components
          // In Route Handlers, cookie-setting failures should be logged
          //
          // Context: Server Components cannot set cookies (RSC limitation)
          // but Route Handlers MUST set cookies for auth to work.
          //
          // Check if this is a Server Component error (cannot set headers after streaming)
          // vs a Route Handler error (actual cookie-setting failure)
          if (error instanceof Error) {
            // Server Component error: "Cookies can only be modified in a Server Action or Route Handler"
            if (error.message.includes('Server Action or Route Handler')) {
              // Expected: Server Component trying to set cookies - middleware will handle
              return;
            }

            // Route Handler error: actual cookie-setting failure - log it
            logger.error('Failed to set auth cookies in Route Handler', error, {
              context: 'supabase_server_client',
              cookieCount: cookiesToSet.length,
              errorMessage: error.message,
            });
          }
        }
      },
    },
  });
}
