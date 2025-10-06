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

export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
