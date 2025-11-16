'use server';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

interface AuthGuardOptions {
  context?: string;
  requireUser?: boolean;
}

export interface AuthenticatedUserResult {
  user: User | null;
  isAuthenticated: boolean;
  error?: Error;
}

/**
 * Shared helper for retrieving the currently authenticated Supabase user.
 * Provides consistent logging + error normalization across server components/actions.
 */
export async function getAuthenticatedUser(
  options?: AuthGuardOptions
): Promise<AuthenticatedUserResult> {
  const supabase = await createClient();
  return getAuthenticatedUserFromClient(supabase, options);
}

/**
 * Variant that accepts an existing Supabase client (for custom contexts like Statsig/edge handlers).
 */
export async function getAuthenticatedUserFromClient(
  supabase: SupabaseClient<Database>,
  options?: AuthGuardOptions
): Promise<AuthenticatedUserResult> {
  const contextLabel = options?.context || 'auth_guard';

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      const normalized = normalizeError(error, 'Failed to fetch authenticated user');
      logger.error(`${contextLabel}: supabase auth getUser failed`, normalized);
      if (options?.requireUser) {
        throw normalized;
      }
      return {
        user: null,
        isAuthenticated: false,
        error: normalized,
      };
    }

    if (!user) {
      if (options?.requireUser) {
        const unauthorizedError = new Error('Unauthorized. No authenticated user session found.');
        logger.warn(`${contextLabel}: no authenticated session present`);
        throw unauthorizedError;
      }

      return {
        user: null,
        isAuthenticated: false,
      };
    }

    return {
      user,
      isAuthenticated: true,
    };
  } catch (error) {
    const normalized = normalizeError(error, 'Unexpected auth guard failure');
    logger.error(`${contextLabel}: unexpected error retrieving authenticated user`, normalized);
    if (options?.requireUser) {
      throw normalized;
    }
    return {
      user: null,
      isAuthenticated: false,
      error: normalized,
    };
  }
}
