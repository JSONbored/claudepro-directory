'use client';

import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';

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
  supabaseClient: ReturnType<typeof createClient>;
}

export function useAuthenticatedUser(
  options?: UseAuthenticatedUserOptions
): UseAuthenticatedUserResult {
  const contextLabel = options?.context ?? 'useAuthenticatedUser';
  const subscribe = options?.subscribe ?? true;
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError) {
        const normalized = new Error(authError.message ?? 'Failed to fetch authenticated user');
        logger.error(`${contextLabel}: supabase auth getUser failed`, normalized);
        return { user: null, error: normalized };
      }
      return { user: data.user ?? null, error: null };
    } catch (caught) {
      const normalized =
        caught instanceof Error
          ? caught
          : new Error(typeof caught === 'string' ? caught : 'Unknown auth error');
      logger.error(`${contextLabel}: unexpected auth getUser failure`, normalized);
      return { user: null, error: normalized };
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
    let active = true;
    const init = async () => {
      const result = await fetchUser();
      if (!active) return;
      setUser(result.user);
      setStatus(result.user ? 'authenticated' : 'unauthenticated');
      setError(result.error);
    };

    init().catch(() => {
      // fetchUser already logs errors internally
    });

    let subscription: { unsubscribe: () => void } | undefined;
    if (subscribe) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        setUser(session?.user ?? null);
        setStatus(session?.user ? 'authenticated' : 'unauthenticated');
        setError(null);
      });
      subscription = data.subscription;
    }

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [fetchUser, subscribe, supabase]);

  return {
    user,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    error,
    refreshUser,
    supabaseClient: supabase,
  };
}
