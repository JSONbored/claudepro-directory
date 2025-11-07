/**
 * Supabase Anonymous Client (Server-Side)
 *
 * Used for loading public content during static generation and ISR.
 * Does NOT use cookies - suitable for build-time data fetching.
 *
 * Use this client for:
 * - Public content (agents, commands, rules, etc.)
 * - Static/ISR page generation
 * - SEO metadata
 * - Sitemap generation
 * - Any cached data that doesn't require authentication
 *
 * For user-specific operations, use createClient() from server.ts instead.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database.types';

export function createAnonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // In development without env vars, return a mock client
  if (!(supabaseUrl && supabaseAnonKey)) {
    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint/suspicious/noConsole: Intentional development warning for missing Supabase credentials
      console.warn(
        '⚠️  Supabase env vars not found - using mock anon client for development. Database features will not work.'
      );

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
        rpc: () => mockQueryBuilder,
      } as unknown as ReturnType<typeof createSupabaseClient<Database>>;
    }
    throw new Error(
      'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  // Note: No logger here - logger uses Date which breaks ISR static generation

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
    db: {
      schema: 'public',
    },
  });
}
