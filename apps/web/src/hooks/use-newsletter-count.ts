'use client';

/**
 * Newsletter Subscriber Count Hook
 * Provides live subscriber count with localStorage caching and visibility-based polling
 * Uses API route for data fetching (avoids HMR issues with server actions)
 */

import { POLLING_CONFIG } from '@heyclaude/web-runtime/config/unified-config';
import { logClientError, logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { useInterval, useIsClient, useBoolean, useLocalStorage } from '@heyclaude/web-runtime/hooks';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const { value: isLoading, setFalse: setIsLoadingFalse } = useBoolean(true);
  const [error, setError] = useState<Error | null>(null);
  const [cacheTtlMs, setCacheTtlMs] = useState(LOCAL_STORAGE_CACHE_TTL_MS);
  const [pollIntervalMs, setPollIntervalMs] = useState(DEFAULT_POLL_INTERVAL_MS);
  const { value: isTabVisible, setValue: setIsTabVisible } = useBoolean(true);
  const configLoadedRef = useRef(false);
  const isClient = useIsClient();
  
  // Use useLocalStorage hooks for cache management
  const { value: cachedCount, setValue: setCachedCount } = useLocalStorage<string | null>(CACHE_KEY, {
    defaultValue: null,
    syncAcrossTabs: false,
  });
  const { value: cacheTimestamp, setValue: setCacheTimestamp } = useLocalStorage<string | null>(CACHE_TIMESTAMP_KEY, {
    defaultValue: null,
    syncAcrossTabs: false,
  });

  // Load config from unified config once when hook mounts (client-side only)
  useEffect(() => {
    if (configLoadedRef.current) return;
    configLoadedRef.current = true;

    // Use default localStorage cache TTL (5 minutes)
    setCacheTtlMs(LOCAL_STORAGE_CACHE_TTL_MS);

    const pollInterval = POLLING_CONFIG.newsletter_count_ms ?? DEFAULT_POLL_INTERVAL_MS;
    setPollIntervalMs(pollInterval);
  }, []);

  // Fetch count function (using useCallback to update ref)
  const fetchCountRef = useRef<() => Promise<void>>(async () => {});

  const fetchCount = useCallback(async () => {
    // Check cache first
    if (isClient && cachedCount && cacheTimestamp) {
      const cacheAge = Date.now() - Number.parseInt(cacheTimestamp, 10);

      if (cacheAge < cacheTtlMs) {
        const parsedCount = Number.parseInt(cachedCount, 10);
        if (!Number.isNaN(parsedCount)) {
          setCount(parsedCount);
          setIsLoadingFalse();
          return;
        }
      }
    }

    // Fetch from API route (avoids HMR issues with server actions)
    try {
      const response = await fetch('/api/flux/email/count', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch newsletter count: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const newCount = data?.count ?? null;

      if (newCount === null || typeof newCount !== 'number') {
        throw new Error('Invalid newsletter count response');
      } else {
        setCount(newCount);
        setIsLoadingFalse();
        setError(null);

        // Update cache using useLocalStorage hooks
        if (isClient) {
          setCachedCount(newCount.toString());
          setCacheTimestamp(Date.now().toString());
        }
      }
    } catch (error_: unknown) {
      const normalized = normalizeError(error_, 'Failed to fetch newsletter count');
      logClientError(
        '[Newsletter] Failed to fetch newsletter count',
        normalized,
        'useNewsletterCount.fetch',
        {
          component: 'useNewsletterCount',
          action: 'fetch-count',
          category: 'newsletter',
        }
      );
      setError(error_ as Error);
      setIsLoadingFalse();
    }
  }, [cacheTtlMs, isClient, cachedCount, cacheTimestamp, setCachedCount, setCacheTimestamp]);

  // Update ref when fetchCount changes
  useEffect(() => {
    fetchCountRef.current = fetchCount;
  }, [fetchCount]);

  // Initial fetch
  useEffect(() => {
    fetchCount().catch((error_: unknown) => {
      const normalized = normalizeError(error_, 'Initial newsletter count fetch failed');
      logClientWarn(
        '[Newsletter] Initial fetch failed',
        normalized,
        'useNewsletterCount.fetch',
        {
          component: 'useNewsletterCount',
          action: 'initial-fetch',
          category: 'newsletter',
        }
      );
    });
  }, [fetchCount]);

  // Visibility API: Track tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
      // Fetch immediately when tab becomes visible
      if (!document.hidden && fetchCountRef.current) {
        fetchCountRef.current().catch((error_: unknown) => {
          const normalized = normalizeError(error_, 'Resume newsletter count fetch failed');
          logClientWarn(
            '[Newsletter] Resume fetch failed',
            normalized,
            'useNewsletterCount.resume',
            {
              component: 'useNewsletterCount',
              action: 'resume-fetch',
              category: 'newsletter',
            }
          );
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Polling with useInterval (pauses when tab is hidden)
  useInterval(
    () => {
      if (fetchCountRef.current) {
        fetchCountRef.current().catch((error_: unknown) => {
          const normalized = normalizeError(error_, 'Polling newsletter count fetch failed');
          logClientWarn(
            '[Newsletter] Polling fetch failed',
            normalized,
            'useNewsletterCount.poll',
            {
              component: 'useNewsletterCount',
              action: 'poll-fetch',
              category: 'newsletter',
            }
          );
        });
      }
    },
    isTabVisible ? pollIntervalMs : null // Pause when tab is hidden
  );

  return { count, isLoading, error };
}
