'use client';

import { createSupabaseBrowserClient } from '../supabase/browser.ts';
import { logClientWarning, normalizeError } from '../errors.ts';
import { logger } from '../logger.ts';
import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface UseAuthenticatedUserOptions {
  context?: string;
  subscribe?: boolean;
}

interface UseAuthenticatedUserResult {
  user: User | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  refreshUser: () => Promise<User | null>;
  supabaseClient: ReturnType<typeof createSupabaseBrowserClient>;
}

export function useAuthenticatedUser(
  options?: UseAuthenticatedUserOptions
): UseAuthenticatedUserResult {
  const contextLabel = options?.context ?? 'useAuthenticatedUser';
  const subscribe = options?.subscribe ?? true;
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<Error | null>(null);
  const isFetchingRef = useRef(false);

  // Initialize Supabase client with error handling
  useEffect(() => {
    try {
      const client = createSupabaseBrowserClient();
      setSupabase(client);
    } catch (err) {
      const normalized = err instanceof Error ? err : new Error('Failed to create Supabase client');
      logger.error({ err: normalized }, `${contextLabel}: failed to create Supabase client`);
      setError(normalized);
      setStatus('unauthenticated');
    }
  }, [contextLabel]);

  const fetchUser = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current || !supabase) {
      return { user: null, error: null };
    }

    isFetchingRef.current = true;
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError) {
        // Don't log network errors as errors - they're expected in some cases
        const isNetworkError = authError.message?.includes('fetch') || authError.message?.includes('network');
        const normalized = new Error(authError.message ?? 'Failed to fetch authenticated user');
        
        if (!isNetworkError) {
          logger.error({ err: normalized }, `${contextLabel}: supabase auth getUser failed`);
        } else {
          logger.debug({ err: normalized }, `${contextLabel}: supabase auth getUser network error (expected)`);
        }
        return { user: null, error: normalized };
      }
      return { user: data.user ?? null, error: null };
    } catch (caught) {
      const normalized =
        caught instanceof Error
          ? caught
          : new Error(typeof caught === 'string' ? caught : 'Unknown auth error');
      // Only log unexpected errors, not network issues
      const isNetworkError = normalized.message?.includes('fetch') || normalized.message?.includes('network');
      if (!isNetworkError) {
        logger.error({ err: normalized }, `${contextLabel}: unexpected auth getUser failure`);
      }
      return { user: null, error: normalized };
    } finally {
      isFetchingRef.current = false;
    }
  }, [supabase, contextLabel]);

  const refreshUser = useCallback(async () => {
    setStatus('loading');
    const result = await fetchUser();
    setUser(result.user);
    setStatus(result.user ? 'authenticated' : 'unauthenticated');
    setError(result.error);
    return result.user;
  }, [fetchUser]);

  useEffect(() => {
    if (!supabase) {
      // Wait for Supabase client to be initialized
      return;
    }

    let active = true;
    const init = async () => {
      const result = await fetchUser();
      if (!active) return;
      setUser(result.user);
      setStatus(result.user ? 'authenticated' : 'unauthenticated');
      setError(result.error);
    };

    init().catch((error) => {
      if (active) {
        logClientWarning('useAuthenticatedUser: initial fetch failed', error, {
          context: contextLabel,
        });
        setStatus('unauthenticated');
        setError(error instanceof Error ? error : new Error('Initial fetch failed'));
      }
    });

    let subscription: { unsubscribe: () => void } | undefined;
    if (subscribe) {
      try {
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!active) return;
          setUser(session?.user ?? null);
          setStatus(session?.user ? 'authenticated' : 'unauthenticated');
          setError(null);
        });
        subscription = data.subscription;
      } catch (err) {
        // Gracefully handle subscription errors
        const normalized = normalizeError(err, 'Failed to subscribe to auth state changes');
        logger.debug({ err: normalized }, `${contextLabel}: failed to subscribe to auth state changes`);
      }
    }

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [fetchUser, subscribe, supabase, contextLabel]);

  return {
    user,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    error,
    refreshUser,
    supabaseClient: supabase ?? ({} as ReturnType<typeof createSupabaseBrowserClient>),
  };
}
