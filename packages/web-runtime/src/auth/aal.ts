/**
 * Authenticator Assurance Level (AAL) Utilities
 * Helpers for checking AAL in RLS policies and server-side code
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';
import { getAuthenticatorAssuranceLevel, type AuthenticatorAssuranceLevel } from './mfa.ts';

/**
 * Extract AAL from JWT claims
 * Returns 'aal1' if not present (default)
 */
export function extractAALFromClaims(claims: Record<string, unknown>): AuthenticatorAssuranceLevel {
  const aal = claims['aal'];
  if (aal === 'aal2') {
    return 'aal2';
  }
  return 'aal1'; // Default to aal1 if not present
}

/**
 * Check if user has AAL2 in their current session
 * Use this in server-side code to enforce MFA requirements
 */
export async function hasAAL2(
  supabase: SupabaseClient<Database>
): Promise<{ hasAAL2: boolean; error: Error | null }> {
  try {
    const { data, error } = await getAuthenticatorAssuranceLevel(supabase);

    if (error || !data) {
      return { hasAAL2: false, error };
    }

    return { hasAAL2: data.currentLevel === 'aal2', error: null };
  } catch (error) {
    return {
      hasAAL2: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * RLS Policy Helper: Check if JWT has AAL2
 * Use this in PostgreSQL RLS policies
 *
 * Example:
 * ```sql
 * create policy "Require AAL2 for sensitive operations"
 *   on sensitive_table
 *   as restrictive
 *   to authenticated
 *   using (auth.jwt()->>'aal' = 'aal2');
 * ```
 */
export const AAL_RLS_CHECK = {
  /**
   * SQL snippet to check for AAL2 in RLS policy
   */
  AAL2_ONLY: "(select auth.jwt()->>'aal') = 'aal2'",
  
  /**
   * SQL snippet to check for AAL1 or AAL2 (any authenticated user)
   */
  AAL1_OR_AAL2: "(select auth.jwt()->>'aal') IN ('aal1', 'aal2') OR (select auth.jwt()->>'aal') IS NULL",
  
  /**
   * SQL snippet to check if user has enrolled MFA factors
   * Use this for "enforce only for users that have opted-in" policy
   */
  HAS_ENROLLED_MFA: `
    array[(select auth.jwt()->>'aal')] <@ (
      select
        case
          when count(id) > 0 then array['aal2']
          else array['aal1', 'aal2']
        end as aal
      from auth.mfa_factors
      where ((select auth.uid()) = user_id) and status = 'verified'
    )
  `,
  
  /**
   * SQL snippet to enforce AAL2 for new users only
   * Replace '2022-12-12T00:00:00Z' with your cutoff date
   */
  AAL2_FOR_NEW_USERS: (cutoffDate: string) => `
    array[(select auth.jwt()->>'aal')] <@ (
      select
        case
          when created_at >= '${cutoffDate}' then array['aal2']
          else array['aal1', 'aal2']
        end as aal
      from auth.users
      where (select auth.uid()) = id
    )
  `,
} as const;
