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
