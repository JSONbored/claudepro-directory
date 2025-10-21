'use client';

/**
 * Search Worker Hook
 *
 * Provides Web Worker-based search with automatic fallback to main thread.
 * Offloads fuzzy search computation to prevent UI blocking.
 *
 * Features:
 * - Progressive enhancement (falls back if workers not supported)
 * - Automatic worker lifecycle management
 * - Request deduplication
 * - Timeout handling
 * - Memory-efficient cleanup
 *
 * Usage:
 * ```tsx
 * const { search, isSupported } = useSearchWorker();
 * const results = await search(query, items, options);
 * ```
 *
 * @module hooks/use-search-worker
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/src/lib/logger';
import type { SearchableItem } from '@/src/lib/schemas/search.schema';

interface SearchOptions {
  threshold?: number;
  limit?: number;
}

interface UseSearchWorkerReturn {
  search: <T extends SearchableItem>(
    query: string,
    items: T[],
    options?: SearchOptions
  ) => Promise<T[]>;
  isSupported: boolean;
  isReady: boolean;
}

let requestIdCounter = 0;

export function useSearchWorker(): UseSearchWorkerReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<
    Map<
      number,
      {
        resolve: (results: SearchableItem[]) => void;
        reject: (error: Error) => void;
        timeout: NodeJS.Timeout;
      }
    >
  >(new Map());

  // Initialize worker
  useEffect(() => {
    // Check if Web Workers are supported
    if (typeof Worker === 'undefined') {
      setIsSupported(false);
      setIsReady(true); // Ready to use fallback
      return undefined;
    }

    setIsSupported(true);

    try {
      // Create worker
      const worker = new Worker('/workers/search.worker.js');
      workerRef.current = worker;

      // Handle messages from worker
      worker.onmessage = (e) => {
        const { type, results, error, requestId } = e.data;

        const pending = pendingRequestsRef.current.get(requestId);
        if (!pending) return;

        // Clear timeout
        clearTimeout(pending.timeout);
        pendingRequestsRef.current.delete(requestId);

        if (type === 'results') {
          pending.resolve(results);
        } else if (type === 'error') {
          pending.reject(new Error(error));
        }
      };

      // Handle worker errors
      worker.onerror = (errorEvent) => {
        logger.error('Search worker error', new Error(errorEvent.message || 'Worker error'));

        // Reject all pending requests
        for (const [, pending] of pendingRequestsRef.current.entries()) {
          clearTimeout(pending.timeout);
          pending.reject(new Error('Worker error'));
        }
        pendingRequestsRef.current.clear();
      };

      setIsReady(true);

      // Cleanup on unmount
      return () => {
        // Clear all pending requests
        for (const [, pending] of pendingRequestsRef.current.entries()) {
          clearTimeout(pending.timeout);
          pending.reject(new Error('Worker terminated'));
        }
        pendingRequestsRef.current.clear();

        // Terminate worker
        worker.terminate();
        workerRef.current = null;
      };
    } catch (error) {
      logger.error(
        'Failed to create search worker',
        error instanceof Error ? error : new Error(String(error))
      );
      setIsSupported(false);
      setIsReady(true); // Ready to use fallback
      return undefined;
    }
  }, []);

  // Search function
  const search = useCallback(
    async <T extends SearchableItem>(
      query: string,
      items: T[],
      options?: SearchOptions
    ): Promise<T[]> => {
      // Fallback to main thread if worker not supported/ready
      if (!(isSupported && workerRef.current)) {
        // Use the existing client-side search as fallback
        const { searchWithFuzzysort } = await import('@/src/lib/client/search-fallback');
        return searchWithFuzzysort(items, query, options);
      }

      // Generate unique request ID
      const requestId = ++requestIdCounter;

      return new Promise<T[]>((resolve, reject) => {
        // Set timeout (5 seconds)
        const timeout = setTimeout(() => {
          pendingRequestsRef.current.delete(requestId);
          reject(new Error('Search timeout'));
        }, 5000);

        // Store pending request
        pendingRequestsRef.current.set(requestId, {
          resolve: resolve as (results: SearchableItem[]) => void,
          reject,
          timeout,
        });

        // Send search request to worker
        workerRef.current!.postMessage({
          type: 'search',
          query,
          items,
          options,
          requestId,
        });
      });
    },
    [isSupported]
  );

  return {
    search,
    isSupported,
    isReady,
  };
}
