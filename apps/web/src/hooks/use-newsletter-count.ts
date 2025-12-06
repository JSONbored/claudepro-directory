'use client';

/**
 * Newsletter Subscriber Count Hook
 * Provides live subscriber count with localStorage caching and visibility-based polling
 * Uses secure server action for data fetching
 */

import { getNewsletterCountAction } from '@heyclaude/web-runtime/actions';
import { POLLING_CONFIG } from '@heyclaude/web-runtime/config/unified-config';
import { logClientError, logClientWarn } from '@heyclaude/web-runtime/logging/client';
import { useEffect, useRef, useState } from 'react';

export interface UseNewsletterCountReturn {
  count: null | number;
  error: Error | null;
  isLoading: boolean;
}

const CACHE_KEY = 'newsletter_count';
const CACHE_TIMESTAMP_KEY = 'newsletter_count_ts';

// Client-side localStorage cache TTL (not related to server-side Cache Components)
const LOCAL_STORAGE_CACHE_TTL_MS = 300_000; // 5 minutes (300 seconds)
const DEFAULT_POLL_INTERVAL_MS = 300_000; // 5 minutes

/**
 * Hook to fetch and poll newsletter subscriber count
 * Features: localStorage caching, visibility-based polling optimization
 */
export function useNewsletterCount(): UseNewsletterCountReturn {
  const [count, setCount] = useState<null | number>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cacheTtlMs, setCacheTtlMs] = useState(LOCAL_STORAGE_CACHE_TTL_MS);
  const [pollIntervalMs, setPollIntervalMs] = useState(DEFAULT_POLL_INTERVAL_MS);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const configLoadedRef = useRef(false);

  // Load config from unified config once when hook mounts (client-side only)
  useEffect(() => {
    if (configLoadedRef.current) return;
    configLoadedRef.current = true;

    // Use default localStorage cache TTL (5 minutes)
    setCacheTtlMs(LOCAL_STORAGE_CACHE_TTL_MS);

    const pollInterval = POLLING_CONFIG.newsletter_count_ms ?? DEFAULT_POLL_INTERVAL_MS;
    setPollIntervalMs(pollInterval);
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      // Check cache first
      if (globalThis.window !== undefined) {
        const cachedCount = localStorage.getItem(CACHE_KEY);
        const cacheTs = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        const cacheAge = Date.now() - (cacheTs ? Number.parseInt(cacheTs, 10) : 0);

        if (cachedCount && cacheAge < cacheTtlMs) {
          setCount(Number.parseInt(cachedCount, 10));
          setIsLoading(false);
          return;
        }
      }

      // Fetch from server action
      try {
        const result = await getNewsletterCountAction({});

        if (result?.serverError) {
          throw new Error(result.serverError);
        }

        const newCount = result?.data ?? null;

        if (newCount === null) {
          throw new Error('Failed to fetch newsletter count');
        } else {
          setCount(newCount);
          setIsLoading(false);
          setError(null);

          // Update cache
          if (globalThis.window !== undefined) {
            localStorage.setItem(CACHE_KEY, newCount.toString());
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
          }
        }
      } catch (error_) {
        logClientError('Failed to fetch newsletter count', error_, 'useNewsletterCount.fetch');
        setError(error_ as Error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchCount().catch((error_) => {
      logClientWarn('useNewsletterCount: initial fetch failed', error_, 'useNewsletterCount.fetch');
    });

    // Start polling with current interval
    intervalRef.current = setInterval(() => {
      fetchCount().catch((error_) => {
        logClientWarn(
          'useNewsletterCount: polling fetch failed',
          error_,
          'useNewsletterCount.poll',
          {
            component: 'useNewsletterCount',
          }
        );
      });
    }, pollIntervalMs);

    // Visibility API: Pause polling when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Resume polling when tab becomes visible
        fetchCount().catch((error_) => {
          logClientWarn(
            'useNewsletterCount: resume fetch failed',
            error_,
            'useNewsletterCount.resume'
          );
        });
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            fetchCount().catch((error_) => {
              logClientWarn(
                'useNewsletterCount: polling fetch failed',
                error_,
                'useNewsletterCount.poll'
              );
            });
          }, pollIntervalMs);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cacheTtlMs, pollIntervalMs]);

  return { count, isLoading, error };
}
