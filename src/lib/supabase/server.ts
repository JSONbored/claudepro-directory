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

  // In development without env vars, return a mock client that won't crash
  if (!(supabaseUrl && supabaseAnonKey)) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn(
        'Supabase env vars not found - using mock server client for development. Database features will not work.'
      );
      // Return a mock client that matches the Supabase client interface
      // Chainable query builder that returns a Promise with chainable methods
      type MockQueryResult = Promise<{ data: null; error: null }>;

      const promise = Promise.resolve({ data: null, error: null }) as MockQueryResult;

      const mockQueryBuilder = promise as MockQueryResult & {
        select: () => MockQueryResult;
        insert: () => MockQueryResult;
        update: () => MockQueryResult;
        delete: () => MockQueryResult;
        eq: () => MockQueryResult;
        neq: () => MockQueryResult;
        gt: () => MockQueryResult;
        gte: () => MockQueryResult;
        lt: () => MockQueryResult;
        lte: () => MockQueryResult;
        like: () => MockQueryResult;
        ilike: () => MockQueryResult;
        is: () => MockQueryResult;
        in: () => MockQueryResult;
        order: () => MockQueryResult;
        limit: () => MockQueryResult;
        range: () => MockQueryResult;
        single: () => MockQueryResult;
        maybeSingle: () => MockQueryResult;
      };

      // Assign chainable methods
      mockQueryBuilder.select = () => mockQueryBuilder;
      mockQueryBuilder.insert = () => mockQueryBuilder;
      mockQueryBuilder.update = () => mockQueryBuilder;
      mockQueryBuilder.delete = () => mockQueryBuilder;
      mockQueryBuilder.eq = () => mockQueryBuilder;
      mockQueryBuilder.neq = () => mockQueryBuilder;
      mockQueryBuilder.gt = () => mockQueryBuilder;
      mockQueryBuilder.gte = () => mockQueryBuilder;
      mockQueryBuilder.lt = () => mockQueryBuilder;
      mockQueryBuilder.lte = () => mockQueryBuilder;
      mockQueryBuilder.like = () => mockQueryBuilder;
      mockQueryBuilder.ilike = () => mockQueryBuilder;
      mockQueryBuilder.is = () => mockQueryBuilder;
      mockQueryBuilder.in = () => mockQueryBuilder;
      mockQueryBuilder.order = () => mockQueryBuilder;
      mockQueryBuilder.limit = () => mockQueryBuilder;
      mockQueryBuilder.range = () => mockQueryBuilder;
      mockQueryBuilder.single = () => mockQueryBuilder;
      mockQueryBuilder.maybeSingle = () => mockQueryBuilder;

      return {
        auth: {
          getUser: async () => ({ data: { user: null }, error: null }),
          signOut: async () => ({ error: null }),
        },
        from: () => mockQueryBuilder,
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
