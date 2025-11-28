/**
 * Supabase Anonymous Client (Server-Side)
 * Used for static generation + ISR where cookies aren't needed.
 */

import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';

type SupabaseAnonClient = ReturnType<typeof createSupabaseClient<Database>>;

export function createSupabaseAnonClient(): SupabaseAnonClient {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] || process.env['SUPABASE_URL'];
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || process.env['SUPABASE_ANON_KEY'];

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable. ' +
      'Please ensure your .env.local file contains NEXT_PUBLIC_SUPABASE_URL.'
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY environment variable. ' +
      'Please ensure your .env.local file contains NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
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
