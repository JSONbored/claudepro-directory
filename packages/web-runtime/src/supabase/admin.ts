/**
 * Supabase Admin Client (Service Role)
 * WARNING: bypasses RLS; for trusted server-side contexts only.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';

type SupabaseAdminClient = ReturnType<typeof createSupabaseClient<Database>>;

export function createSupabaseAdminClient(): SupabaseAdminClient {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!(supabaseUrl && supabaseServiceKey)) {
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
