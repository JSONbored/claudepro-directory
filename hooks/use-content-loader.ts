import { useCallback, useEffect, useState } from 'react';
import { CACHE_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import type { ContentLoaderState, UseContentLoaderOptions } from '@/lib/schemas/component.schema';
import type {
  AgentContent,
  CommandContent,
  ContentItem,
  HookContent,
  McpContent,
  RuleContent,
} from '@/lib/schemas/content.schema';

type ContentType =
  | 'agents'
  | 'mcp'
  | 'commands'
  | 'hooks'
  | 'rules'
  | 'guides'
  | 'jobs'
  | 'tutorials'
  | 'comparisons'
  | 'troubleshooting'
  | 'use-cases'
  | 'workflows'
  | 'categories'
  | 'collections';

// Cache for storing loaded content
const contentCache = new Map<string, { data: ContentItem; timestamp: number }>();

/**
 * Reusable hook for loading content items with caching and related items
 * Reduces code duplication across detail pages
 */
export function useContentLoader<T extends ContentItem>({
  type,
  slug,
  preloadRelated = true,
  cacheTime = CACHE_CONFIG.durations.shortTerm,
}: UseContentLoaderOptions): ContentLoaderState<T> {
  const [state, setState] = useState<ContentLoaderState<T>>({
    data: null,
    relatedItems: [],
    isLoading: true,
    error: null,
    refetch: async () => {
      // Will be replaced by actual refetch function
    },
  });

  const getCacheKey = useCallback((contentType: string, contentSlug: string) => {
    return `${contentType}:${contentSlug}`;
  }, []);

  const loadRelatedItems = useCallback(
    async (contentType: ContentType, contentSlug: string, currentItem: ContentItem) => {
      try {
        const module = await import('@/generated/content');

        let rawItems: (AgentContent | McpContent | CommandContent | HookContent | RuleContent)[] =
          [];
        switch (contentType) {
          case 'agents':
            rawItems = module.agents;
            break;
          case 'mcp':
            rawItems = module.mcp;
            break;
          case 'commands':
            rawItems = module.commands;
            break;
          case 'hooks':
            rawItems = module.hooks;
            break;
          case 'rules':
            rawItems = module.rules;
            break;
          default:
            rawItems = [];
        }

        // Transform and validate content to ensure all required fields are present
        const allItems: ContentItem[] = rawItems.map((item) => ({
          ...item,
          source: item.source || 'community', // Default source if missing
        }));

        // Filter related items by category
        const related = allItems
          .filter((item) => item.slug !== contentSlug && item.category === currentItem.category)
          .slice(0, 3) as T[];

        setState((prev) => ({
          ...prev,
          relatedItems: related,
        }));
      } catch (error) {
        logger.warn('Failed to load related items', {
          type: contentType,
          slug: contentSlug,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    []
  );

  const loadContent = useCallback(async () => {
    if (!slug) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: new Error('No slug provided'),
      }));
      return;
    }

    const cacheKey = getCacheKey(type, slug);

    // Check cache first
    const cached = contentCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      setState((prev) => ({
        ...prev,
        data: cached.data as T,
        isLoading: false,
      }));

      // Load related items in background
      if (preloadRelated) {
        loadRelatedItems(type, slug, cached.data as T);
      }
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Dynamic imports based on content type
      const { default: getContentBySlug, default: getFullContent } = await import(
        '@/generated/content'
      ).then((module) => {
        switch (type) {
          case 'agents':
            return {
              default: module.getAgentBySlug,
              getFullContent: module.getAgentFullContent,
            };
          case 'mcp':
            return {
              default: module.getMcpBySlug,
              getFullContent: module.getMcpFullContent,
            };
          case 'commands':
            return {
              default: module.getCommandBySlug,
              getFullContent: module.getCommandFullContent,
            };
          case 'hooks':
            return {
              default: module.getHookBySlug,
              getFullContent: module.getHookFullContent,
            };
          case 'rules':
            return {
              default: module.getRuleBySlug,
              getFullContent: module.getRuleFullContent,
            };
          default:
            throw new Error(`Unknown content type: ${type}`);
        }
      });

      // Get metadata first
      const rawMetadata = getContentBySlug(slug);
      if (!rawMetadata) {
        throw new Error(`Content not found: ${slug}`);
      }

      // Transform metadata to ensure all required fields are present
      const metadata: ContentItem = {
        ...rawMetadata,
        source: rawMetadata.source || 'community', // Default source if missing
      };

      // Try to get full content
      let fullContent: ContentItem | null = null;
      try {
        const rawFullContent = await getFullContent(slug);
        if (rawFullContent) {
          // Transform full content to ensure all required fields are present
          fullContent = {
            ...rawFullContent,
            source: rawFullContent.source || 'community', // Default source if missing
          };
        }
      } catch (error) {
        logger.warn('Failed to load full content, using metadata only', {
          type,
          slug,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      const content = (fullContent || metadata) as T;

      // Cache the content
      contentCache.set(cacheKey, {
        data: content,
        timestamp: Date.now(),
      });

      setState((prev) => ({
        ...prev,
        data: content,
        isLoading: false,
      }));

      // Load related items
      if (preloadRelated) {
        await loadRelatedItems(type, slug, content);
      }
    } catch (error) {
      logger.error(
        'Failed to load content',
        error instanceof Error ? error : new Error(String(error)),
        {
          type,
          slug,
        }
      );

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to load content'),
      }));
    }
  }, [slug, type, cacheTime, getCacheKey, preloadRelated, loadRelatedItems]);

  // Set up refetch function
  const refetch = useCallback(async () => {
    // Clear cache for this item
    if (slug) {
      const cacheKey = getCacheKey(type, slug);
      contentCache.delete(cacheKey);
    }
    await loadContent();
  }, [slug, type, getCacheKey, loadContent]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Update refetch in state
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      refetch,
    }));
  }, [refetch]);

  return state;
}

/**
 * Preload content for better UX
 * Call this when hovering over links or on route prefetch
 */
export async function preloadContent(type: ContentType, slug: string) {
  const cacheKey = `${type}:${slug}`;

  // Skip if already cached
  if (contentCache.has(cacheKey)) {
    const cached = contentCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_CONFIG.durations.shortTerm) {
      return;
    }
  }

  try {
    const module = await import('@/generated/content');

    // Create wrapper functions that ensure proper field transformation
    let getContentBySlug: ((slug: string) => ContentItem | null) | null = null;
    switch (type) {
      case 'agents':
        getContentBySlug = (slug: string) => {
          const rawItem = module.getAgentBySlug(slug);
          return rawItem ? { ...rawItem, source: rawItem.source || 'community' } : null;
        };
        break;
      case 'mcp':
        getContentBySlug = (slug: string) => {
          const rawItem = module.getMcpBySlug(slug);
          return rawItem ? { ...rawItem, source: rawItem.source || 'community' } : null;
        };
        break;
      case 'commands':
        getContentBySlug = (slug: string) => {
          const rawItem = module.getCommandBySlug(slug);
          return rawItem ? { ...rawItem, source: rawItem.source || 'community' } : null;
        };
        break;
      case 'hooks':
        getContentBySlug = (slug: string) => {
          const rawItem = module.getHookBySlug(slug);
          return rawItem ? { ...rawItem, source: rawItem.source || 'community' } : null;
        };
        break;
      case 'rules':
        getContentBySlug = (slug: string) => {
          const rawItem = module.getRuleBySlug(slug);
          return rawItem ? { ...rawItem, source: rawItem.source || 'community' } : null;
        };
        break;
      default:
        return;
    }

    const content = getContentBySlug ? getContentBySlug(slug) : null;
    if (content) {
      contentCache.set(cacheKey, {
        data: content,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    logger.debug('Failed to preload content', {
      type,
      slug,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Clear the content cache
 * Useful for testing or when content is updated
 */
export function clearContentCache() {
  contentCache.clear();
}

/**
 * Get current cache size for monitoring
 */
export function getContentCacheSize(): number {
  return contentCache.size;
}
