/**
 * Supabase Anonymous Client (Server-Side)
 * Used for static generation + ISR where cookies aren't needed.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';
import { logger } from '../logger.ts';

type SupabaseAnonClient = ReturnType<typeof createSupabaseClient<Database>>;

export function createSupabaseAnonClient(): SupabaseAnonClient {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] || process.env['SUPABASE_URL'];
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || process.env['SUPABASE_ANON_KEY'];

  if (!(supabaseUrl && supabaseAnonKey)) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('createSupabaseAnonClient: Supabase env vars missing, falling back to mock client', {
        supabaseUrlPresent: Boolean(supabaseUrl),
        supabaseAnonKeyPresent: Boolean(supabaseAnonKey),
      });
    }

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
    } as unknown as SupabaseAnonClient;
  }

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
