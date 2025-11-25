'use client';

/**
 * Newsletter Subscriber Count Hook
 * Provides live subscriber count with localStorage caching and visibility-based polling
 * Uses secure server action for data fetching
 */

import { getNewsletterCountAction } from '@heyclaude/web-runtime/actions';
import { getCacheConfig, getPollingConfig } from '@heyclaude/web-runtime/actions/feature-flags';
import { logClientWarning, logger } from '@heyclaude/web-runtime/core';
import { useEffect, useRef, useState } from 'react';

export interface UseNewsletterCountReturn {
  count: number | null;
  isLoading: boolean;
  error: Error | null;
}

const CACHE_KEY = 'newsletter_count';
const CACHE_TIMESTAMP_KEY = 'newsletter_count_ts';

// Default values (will be overridden by Dynamic Configs from Statsig)
const DEFAULT_CACHE_TTL_MS = 300000; // 5 minutes (300 seconds)
const DEFAULT_POLL_INTERVAL_MS = 300000; // 5 minutes

/**
 * Hook to fetch and poll newsletter subscriber count
 * Features: localStorage caching, visibility-based polling optimization
 * Loads config from Statsig client-side (avoids build-time server calls)
 */
export function useNewsletterCount(): UseNewsletterCountReturn {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cacheTtlMs, setCacheTtlMs] = useState(DEFAULT_CACHE_TTL_MS);
  const [pollIntervalMs, setPollIntervalMs] = useState(DEFAULT_POLL_INTERVAL_MS);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const configLoadedRef = useRef(false);

  // Load config from Statsig once when hook mounts (client-side only)
  useEffect(() => {
    if (configLoadedRef.current) return;
    configLoadedRef.current = true;

    Promise.all([getCacheConfig({}), getPollingConfig({})])
      .then(
        ([cacheResult, pollingResult]: [
          Awaited<ReturnType<typeof getCacheConfig>>,
          Awaited<ReturnType<typeof getPollingConfig>>,
        ]) => {
          if (cacheResult?.data) {
            const cache = cacheResult.data as Record<string, unknown>;
            const cacheTtlSeconds = (cache['cache.newsletter_count_ttl_s'] as number) ?? 300;
            setCacheTtlMs(cacheTtlSeconds * 1000);
          }
          if (pollingResult?.data) {
            const polling = pollingResult.data as Record<string, unknown>;
            const pollInterval = (polling['polling.newsletter_count_ms'] as number) ?? 300000;
            setPollIntervalMs(pollInterval);
          }
        }
      )
      .catch((error) => {
        logClientWarning('useNewsletterCount: failed to load cache/polling config', error);
        // Keep default values on error
      });
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      // Check cache first
      if (typeof window !== 'undefined') {
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

        if (newCount !== null) {
          setCount(newCount);
          setIsLoading(false);
          setError(null);

          // Update cache
          if (typeof window !== 'undefined') {
            localStorage.setItem(CACHE_KEY, newCount.toString());
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
          }
        } else {
          throw new Error('Failed to fetch newsletter count');
        }
      } catch (err) {
        logger.error('Failed to fetch newsletter count', err as Error, {
          context: 'use-newsletter-count',
        });
        setError(err as Error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchCount().catch((err) => {
      logClientWarning('useNewsletterCount: initial fetch failed', err);
    });

    // Start polling with current interval
    intervalRef.current = setInterval(() => {
      fetchCount().catch((err) => {
        logClientWarning('useNewsletterCount: polling fetch failed', err);
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
        fetchCount().catch((err) => {
          logClientWarning('useNewsletterCount: resume fetch failed', err);
        });
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            fetchCount().catch((err) => {
              logClientWarning('useNewsletterCount: polling fetch failed', err);
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
