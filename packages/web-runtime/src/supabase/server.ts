/**
 * Supabase Server Client (Next.js)
 * Handles cookie management + safe fallbacks for missing env vars.
 */

import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@heyclaude/database-types';
import { logger } from '../logger.ts';
import { normalizeError } from '../errors.ts';

type SupabaseServerClient = ReturnType<typeof createServerClient<Database>>;

export async function createSupabaseServerClient(): Promise<SupabaseServerClient> {
  const cookieStore = await cookies();

  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!(supabaseUrl && supabaseAnonKey)) {
    if (process.env['NODE_ENV'] === 'development') {
      logger.warn(
        'Supabase env vars not found - using mock server client for development. Database features will not work.'
      );
    } else {
      throw new Error(
        'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      );
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
    } as unknown as SupabaseServerClient;
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const allCookies = cookieStore.getAll();
        logger.info('Supabase getting cookies', {
          count: allCookies.length,
          names: allCookies.map((c) => c.name),
        });
        return allCookies;
      },
      setAll(cookiesToSet) {
        try {
          logger.info('Supabase setting cookies', {
            count: cookiesToSet.length,
          });
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes('Server Action or Route Handler')) {
              return;
            }
            const normalized = normalizeError(error, 'Failed to set auth cookies in Route Handler');
            logger.error('Failed to set auth cookies in Route Handler', normalized, {
              context: 'supabase_server_client',
              cookieCount: cookiesToSet.length,
              errorMessage: normalized.message,
            });
          } else {
            const normalized = normalizeError(
              error,
              'Failed to set auth cookies in Route Handler (non-Error exception)'
            );
            logger.error(
              'Failed to set auth cookies in Route Handler (non-Error exception)',
              normalized,
              {
                context: 'supabase_server_client',
                cookieCount: cookiesToSet.length,
              }
            );
          }
        }
      },
    },
  });
}
