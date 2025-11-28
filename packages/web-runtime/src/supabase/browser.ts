/**
 * Supabase Browser Client
 * Safe for client components (uses anon key + RLS enforcement).
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@heyclaude/database-types';

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient<Database>>;

export function createSupabaseBrowserClient(): SupabaseBrowserClient {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

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

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
