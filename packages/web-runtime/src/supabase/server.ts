/**
 * Supabase Server Client (Next.js)
 * Handles cookie management + safe fallbacks for missing env vars.
 */

import 'server-only';

import { env } from '@heyclaude/shared-runtime/schemas/env';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@heyclaude/database-types';
import { logger } from '../logger.ts';
import { normalizeError } from '../errors.ts';

type SupabaseServerClient = ReturnType<typeof createServerClient<Database>>;

export async function createSupabaseServerClient(): Promise<SupabaseServerClient> {
  const cookieStore = await cookies();

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please ensure your .env.local file contains NEXT_PUBLIC_SUPABASE_URL.'
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Please ensure your .env.local file contains NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const allCookies = cookieStore.getAll();
        logger.debug({ count: allCookies.length,
          names: allCookies.map((c) => c.name), }, 'Supabase getting cookies');
        return allCookies;
      },
      setAll(cookiesToSet) {
        try {
          logger.info({ count: cookiesToSet.length, }, 'Supabase setting cookies');
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes('Server Action or Route Handler')) {
              return;
            }
            const normalized = normalizeError(error, 'Failed to set auth cookies in Route Handler');
            logger.error({ err: normalized, context: 'supabase_server_client',
              cookieCount: cookiesToSet.length, }, 'Failed to set auth cookies in Route Handler');
          } else {
            const normalized = normalizeError(
              error,
              'Failed to set auth cookies in Route Handler (non-Error exception)'
            );
            logger.error({ err: normalized, context: 'supabase_server_client',
                cookieCount: cookiesToSet.length, }, 'Failed to set auth cookies in Route Handler (non-Error exception)');
          }
        }
      },
    },
  });
}
