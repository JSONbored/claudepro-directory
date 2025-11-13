'use client';

/**
 * Newsletter Subscriber Count Hook
 * Provides live subscriber count with localStorage caching and visibility-based polling
 * Uses secure server action for data fetching
 */

import { useEffect, useRef, useState } from 'react';
import { getCacheConfig, getPollingConfig } from '@/src/lib/actions/feature-flags.actions';
import { getNewsletterCount } from '@/src/lib/actions/newsletter.actions';
import { logger } from '@/src/lib/logger';

export interface UseNewsletterCountReturn {
  count: number | null;
  isLoading: boolean;
  error: Error | null;
}

const CACHE_KEY = 'newsletter_count';
const CACHE_TIMESTAMP_KEY = 'newsletter_count_ts';

// Default values (will be overridden by Dynamic Configs)
let CACHE_TTL_MS = 300000; // 5 minutes (300 seconds)
let POLL_INTERVAL_MS = 300000; // 5 minutes

// Load config from Statsig on module initialization
Promise.all([getCacheConfig(), getPollingConfig()])
  .then(([cache, polling]: [Record<string, unknown>, Record<string, unknown>]) => {
    const cacheTtlSeconds = (cache['cache.newsletter_count_ttl_s'] as number) ?? 300;
    CACHE_TTL_MS = cacheTtlSeconds * 1000;
    POLL_INTERVAL_MS = (polling['polling.newsletter_count_ms'] as number) ?? 300000;
  })
  .catch(() => {
    // Use defaults if config load fails
  });

/**
 * Hook to fetch and poll newsletter subscriber count
 * Features: localStorage caching (1min TTL), visibility-based polling optimization
 */
export function useNewsletterCount(): UseNewsletterCountReturn {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      // Check cache first
      if (typeof window !== 'undefined') {
        const cachedCount = localStorage.getItem(CACHE_KEY);
        const cacheTs = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        const cacheAge = Date.now() - (cacheTs ? Number.parseInt(cacheTs, 10) : 0);

        if (cachedCount && cacheAge < CACHE_TTL_MS) {
          setCount(Number.parseInt(cachedCount, 10));
          setIsLoading(false);
          return;
        }
      }

      // Fetch from server action
      try {
        const newCount = await getNewsletterCount();

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
    fetchCount();

    // Start polling
    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL_MS);

    // Visibility API: Pause polling when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Resume polling when tab becomes visible
        fetchCount();
        if (!intervalRef.current) {
          intervalRef.current = setInterval(fetchCount, POLL_INTERVAL_MS);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { count, isLoading, error };
}
