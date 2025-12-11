/**
 * Supabase Anonymous Client (Server-Side)
 * Used for static generation + ISR where cookies aren't needed.
 */

import 'server-only';

import { env } from '@heyclaude/shared-runtime/schemas/env';
import { getEnvVar } from '@heyclaude/shared-runtime';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';

type SupabaseAnonClient = ReturnType<typeof createSupabaseClient<Database>>;

/**
 * Check if we're in build phase
 */
function isBuildPhase(): boolean {
  const nextPhase = getEnvVar('NEXT_PHASE');
  return nextPhase === 'phase-production-build' || nextPhase === 'phase-production-server';
}

export function createSupabaseAnonClient(): SupabaseAnonClient {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const buildPhase = isBuildPhase() ? ' (BUILD PHASE)' : '';

  if (!supabaseUrl) {
    throw new Error(
      `Missing NEXT_PUBLIC_SUPABASE_URL environment variable${buildPhase}. ` +
      `Please ensure this is set in your environment variables. During build, this must be available and valid.`
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      `Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable${buildPhase}. ` +
      `Please ensure this is set in your environment variables. During build, this must be available and valid.`
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
