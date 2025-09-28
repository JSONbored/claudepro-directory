import { useCallback, useEffect, useState } from 'react';
import { logger } from '../logger';
import type { UnifiedContentItem } from '../schemas/components';
import { contentCache } from '../services/content-cache.service';
import type { ContentByCategory } from '../services/content-processor.service';
import { contentProcessor } from '../services/content-processor.service';

interface UseContentOptions {
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
  useCache?: boolean;
  onError?: (error: Error) => void;
}

interface ContentState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

interface ContentActions {
  refresh: () => Promise<void>;
  clearCache: () => Promise<void>;
}

/**
 * Hook for fetching content by category with caching and error handling
 */
export function useContentByCategory(
  category: string,
  options: UseContentOptions = {}
): ContentState<UnifiedContentItem[]> & ContentActions {
  const { enableAutoRefresh = false, refreshInterval = 300000, useCache = true, onError } = options;

  const [state, setState] = useState<ContentState<UnifiedContentItem[]>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchContent = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      let content: UnifiedContentItem[] | null = null;

      // Try cache first if enabled
      if (useCache) {
        content = await contentCache.getContentByCategory(category);
      }

      // Fetch from GitHub API if cache miss
      if (!content) {
        content = await contentProcessor.getContentByCategory(category);

        // Cache the result
        if (content && useCache) {
          await contentCache.setContentByCategory(category, content);
        }
      }

      setState({
        data: content || [],
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to fetch content for category: ${category}`, err);

      setState((prev) => ({
        ...prev,
        loading: false,
        error: err,
      }));

      onError?.(err);
    }
  }, [category, useCache, onError]);

  const refresh = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  const clearCache = useCallback(async () => {
    try {
      await contentCache.invalidateContent(category);
      await fetchContent();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to clear cache for category: ${category}`, err);
      onError?.(err);
    }
  }, [category, fetchContent, onError]);

  // Initial fetch
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Auto-refresh setup
  useEffect(() => {
    if (!enableAutoRefresh) return;

    const interval = setInterval(fetchContent, refreshInterval);
    return () => clearInterval(interval);
  }, [enableAutoRefresh, refreshInterval, fetchContent]);

  return {
    ...state,
    refresh,
    clearCache,
  };
}

/**
 * Hook for fetching all content with caching and error handling
 */
export function useAllContent(
  options: UseContentOptions = {}
): ContentState<ContentByCategory> & ContentActions {
  const { enableAutoRefresh = false, refreshInterval = 300000, useCache = true, onError } = options;

  const [state, setState] = useState<ContentState<ContentByCategory>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchContent = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      let content: ContentByCategory | null = null;

      // Try cache first if enabled
      if (useCache) {
        content = await contentCache.getAllContent();
      }

      // Fetch from GitHub API if cache miss
      if (!content) {
        content = await contentProcessor.getAllContent();

        // Cache the result
        if (content && useCache) {
          await contentCache.setAllContent(content);
        }
      }

      setState({
        data: content || {},
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to fetch all content', err);

      setState((prev) => ({
        ...prev,
        loading: false,
        error: err,
      }));

      onError?.(err);
    }
  }, [useCache, onError]);

  const refresh = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  const clearCache = useCallback(async () => {
    try {
      await contentCache.invalidateContent();
      await fetchContent();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to clear all content cache', err);
      onError?.(err);
    }
  }, [fetchContent, onError]);

  // Initial fetch
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Auto-refresh setup
  useEffect(() => {
    if (!enableAutoRefresh) return;

    const interval = setInterval(fetchContent, refreshInterval);
    return () => clearInterval(interval);
  }, [enableAutoRefresh, refreshInterval, fetchContent]);

  return {
    ...state,
    refresh,
    clearCache,
  };
}

/**
 * Hook for fetching SEO content with caching and error handling
 */
export function useSEOContent(
  options: UseContentOptions = {}
): ContentState<ContentByCategory> & ContentActions {
  const { enableAutoRefresh = false, refreshInterval = 300000, useCache = true, onError } = options;

  const [state, setState] = useState<ContentState<ContentByCategory>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchContent = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      let content: ContentByCategory | null = null;

      // Try cache first if enabled
      if (useCache) {
        content = await contentCache.getSEOContent();
      }

      // Fetch from GitHub API if cache miss
      if (!content) {
        content = await contentProcessor.getSEOContent();

        // Cache the result
        if (content && useCache) {
          await contentCache.setSEOContent(content);
        }
      }

      setState({
        data: content || {},
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to fetch SEO content', err);

      setState((prev) => ({
        ...prev,
        loading: false,
        error: err,
      }));

      onError?.(err);
    }
  }, [useCache, onError]);

  const refresh = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  const clearCache = useCallback(async () => {
    try {
      await contentCache.invalidateContent();
      await fetchContent();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to clear SEO content cache', err);
      onError?.(err);
    }
  }, [fetchContent, onError]);

  // Initial fetch
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Auto-refresh setup
  useEffect(() => {
    if (!enableAutoRefresh) return;

    const interval = setInterval(fetchContent, refreshInterval);
    return () => clearInterval(interval);
  }, [enableAutoRefresh, refreshInterval, fetchContent]);

  return {
    ...state,
    refresh,
    clearCache,
  };
}

/**
 * Hook for fetching main content with caching and error handling
 */
export function useMainContent(
  options: UseContentOptions = {}
): ContentState<ContentByCategory> & ContentActions {
  const { enableAutoRefresh = false, refreshInterval = 300000, useCache = true, onError } = options;

  const [state, setState] = useState<ContentState<ContentByCategory>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchContent = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      let content: ContentByCategory | null = null;

      // Try cache first if enabled
      if (useCache) {
        content = await contentCache.getMainContent();
      }

      // Fetch from GitHub API if cache miss
      if (!content) {
        content = await contentProcessor.getMainContent();

        // Cache the result
        if (content && useCache) {
          await contentCache.setMainContent(content);
        }
      }

      setState({
        data: content || {},
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to fetch main content', err);

      setState((prev) => ({
        ...prev,
        loading: false,
        error: err,
      }));

      onError?.(err);
    }
  }, [useCache, onError]);

  const refresh = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  const clearCache = useCallback(async () => {
    try {
      await contentCache.invalidateContent();
      await fetchContent();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to clear main content cache', err);
      onError?.(err);
    }
  }, [fetchContent, onError]);

  // Initial fetch
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Auto-refresh setup
  useEffect(() => {
    if (!enableAutoRefresh) return;

    const interval = setInterval(fetchContent, refreshInterval);
    return () => clearInterval(interval);
  }, [enableAutoRefresh, refreshInterval, fetchContent]);

  return {
    ...state,
    refresh,
    clearCache,
  };
}
