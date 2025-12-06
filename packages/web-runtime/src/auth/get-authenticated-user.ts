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
      // When auth is optional (requireUser=false), missing session is expected and should be debug level
      // Only log as error if auth is required or if it's an actual error (not just missing session)
      if (options?.requireUser) {
        logger.error(`${contextLabel}: supabase auth getUser failed`, normalized);
        throw normalized;
      }
      // Optional auth: missing session is expected, log at debug level
      // Only log as error if it's not a session missing error (e.g., network error)
      if (error.message?.includes('session') || error.message?.includes('Auth session missing')) {
        logger.debug(`${contextLabel}: no authenticated session (optional auth)`, {
          errorMessage: normalized.message,
          errorName: normalized.name,
        });
      } else {
        // Actual error (network, etc.) - log as warn even for optional auth
        logger.warn(`${contextLabel}: supabase auth getUser failed (optional auth)`, {
          err: normalized,
        });
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
