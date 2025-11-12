'use client';

/**
 * Newsletter Subscriber Count Hook
 * Provides live subscriber count for social proof display
 */

import { useEffect, useState } from 'react';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';

export interface UseNewsletterCountReturn {
  count: number | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and poll newsletter subscriber count
 * Updates every 30 seconds for social proof
 */
export function useNewsletterCount(): UseNewsletterCountReturn {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const supabase = createClient();
        // Type assertion: RPC function will be created by user running SQL
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: rpcError } = await supabase.rpc(
          'get_newsletter_subscriber_count' as any
        );

        if (rpcError) throw rpcError;

        setCount(data as number);
        setIsLoading(false);
        setError(null);
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

    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return { count, isLoading, error };
}
