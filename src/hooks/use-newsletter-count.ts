'use client';

/**
 * Newsletter Subscriber Count Hook
 * Provides live subscriber count with localStorage caching and visibility-based polling
 */

import { useEffect, useRef, useState } from 'react';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';

export interface UseNewsletterCountReturn {
  count: number | null;
  isLoading: boolean;
  error: Error | null;
}

const CACHE_KEY = 'newsletter_count';
const CACHE_TIMESTAMP_KEY = 'newsletter_count_ts';
const CACHE_TTL_MS = 60000; // 1 minute
const POLL_INTERVAL_MS = 30000; // 30 seconds

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
        const cacheAge = Date.now() - (cacheTs ? parseInt(cacheTs, 10) : 0);

        if (cachedCount && cacheAge < CACHE_TTL_MS) {
          setCount(parseInt(cachedCount, 10));
          setIsLoading(false);
          return;
        }
      }

      // Fetch from database
      try {
        const supabase = createClient();
        // Type assertion: RPC function will be created by user running SQL
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: rpcError } = await supabase.rpc(
          'get_newsletter_subscriber_count' as any
        );

        if (rpcError) throw rpcError;

        const newCount = data as number;
        setCount(newCount);
        setIsLoading(false);
        setError(null);

        // Update cache
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, newCount.toString());
          localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
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
