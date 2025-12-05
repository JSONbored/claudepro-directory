/**
 * Supabase Admin Client (Service Role)
 * WARNING: bypasses RLS; for trusted server-side contexts only.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';

type SupabaseAdminClient = ReturnType<typeof createSupabaseClient<Database>>;

/**
 * Creates a Supabase admin client with service role permissions.
 * 
 * NOTE: We read from process.env directly instead of the cached `env` schema
 * to avoid module-level caching issues where env vars may not be available
 * at the time the schema module is first loaded (e.g., during Inngest function
 * invocation where modules may be loaded before Next.js injects env vars).
 */
export function createSupabaseAdminClient(): SupabaseAdminClient {
  // Read directly from process.env to avoid caching issues
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!(supabaseUrl && supabaseServiceKey)) {
    // Provide detailed debugging info
    const hasUrl = !!supabaseUrl;
    const hasKey = !!supabaseServiceKey;
    throw new Error(
      `Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL (${hasUrl ? 'set' : 'MISSING'}) and SUPABASE_SERVICE_ROLE_KEY (${hasKey ? 'set' : 'MISSING'}). ` +
      `Ensure these are set in your .env.local file and that the Next.js dev server has been restarted.`
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
