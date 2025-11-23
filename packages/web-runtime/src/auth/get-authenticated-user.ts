import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';
import { logger } from '../logger.ts';
import { normalizeError } from '../errors.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';

interface AuthGuardOptions {
  context?: string;
  requireUser?: boolean;
}

export interface AuthenticatedUserResult {
  user: User | null;
  isAuthenticated: boolean;
  error?: Error;
}

export async function getAuthenticatedUser(
  options?: AuthGuardOptions
): Promise<AuthenticatedUserResult> {
  const supabase = await createSupabaseServerClient();
  return getAuthenticatedUserFromClient(supabase, options);
}

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
