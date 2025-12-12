/**
 * Supabase Admin Client (Service Role)
 * WARNING: bypasses RLS; for trusted server-side contexts only.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';
import { getEnvVar } from '@heyclaude/shared-runtime';
import { env } from '@heyclaude/shared-runtime/schemas/env';

type SupabaseAdminClient = ReturnType<typeof createSupabaseClient<Database>>;

/**
 * Check if we're in build phase
 */
function isBuildPhase(): boolean {
  const nextPhase = getEnvVar('NEXT_PHASE');
  return nextPhase === 'phase-production-build' || nextPhase === 'phase-production-server';
}

/**
 * Creates a Supabase admin client with service role permissions.
 * 
 * NOTE: We read from process.env directly instead of the cached `env` schema
 * to avoid module-level caching issues where env vars may not be available
 * at the time the schema module is first loaded (e.g., during Inngest function
 * invocation where modules may be loaded before Next.js injects env vars).
 */
export function createSupabaseAdminClient(): SupabaseAdminClient {
  // Use validated env schema (handles empty strings -> undefined)
  // Fallback to process.env for SUPABASE_SERVICE_ROLE_KEY (not in public schema)
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

  const buildPhase = isBuildPhase() ? ' (BUILD PHASE)' : '';

  if (!supabaseUrl) {
    throw new Error(
      `Missing or invalid NEXT_PUBLIC_SUPABASE_URL environment variable${buildPhase}. ` +
      `Ensure this is set in your environment variables with a valid URL. During build, this must be available and valid.`
    );
  }

  if (!supabaseServiceKey) {
    throw new Error(
      `Missing SUPABASE_SERVICE_ROLE_KEY environment variable${buildPhase}. ` +
      `Ensure this is set in your environment variables. During build, this must be available.`
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
