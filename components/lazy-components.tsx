import dynamic from 'next/dynamic';
import type React from 'react';

// Generate stable keys for skeleton items (prevents unnecessary re-renders)
const generateSkeletonKeys = () => Array.from({ length: 6 }, () => crypto.randomUUID());

// Lazy load heavy components with proper loading states
export const LazyUnifiedSearch = dynamic(
  () => import('./unified-search').then((mod) => ({ default: mod.UnifiedSearch })),
  {
    loading: () => <div className="w-full h-12 bg-card/50 rounded-lg animate-pulse" />,
  }
);

export const LazyInfiniteScrollContainer = dynamic(
  () =>
    import('./infinite-scroll-container').then((mod) => ({ default: mod.InfiniteScrollContainer })),
  {
    loading: () => (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {generateSkeletonKeys().map((key) => (
          <div key={key} className="animate-pulse">
            <div className="bg-card/50 rounded-lg p-6 space-y-4">
              <div className="h-6 bg-card/70 rounded w-3/4" />
              <div className="h-4 bg-card/70 rounded w-full" />
              <div className="h-4 bg-card/70 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    ),
  }
) as <T>(
  props: import('./infinite-scroll-container').InfiniteScrollContainerProps<T>
) => React.JSX.Element;

export const LazyConfigCard = dynamic(
  () => import('./config-card').then((mod) => ({ default: mod.ConfigCard })),
  {
    loading: () => (
      <div className="animate-pulse bg-card/50 rounded-lg p-6 space-y-4">
        <div className="h-6 bg-card/70 rounded w-3/4" />
        <div className="h-4 bg-card/70 rounded w-full" />
        <div className="h-4 bg-card/70 rounded w-2/3" />
      </div>
    ),
  }
);

export const LazyContentSearchClient = dynamic(
  () => import('./content-search-client').then((mod) => ({ default: mod.ContentSearchClient })),
  {
    loading: () => (
      <div className="w-full space-y-4 animate-pulse">
        <div className="h-12 bg-card/50 rounded-lg" />
        <div className="flex gap-2 justify-end">
          <div className="h-10 w-24 bg-card/50 rounded-lg" />
          <div className="h-10 w-20 bg-card/50 rounded-lg" />
        </div>
      </div>
    ),
  }
);

export const LazyTabsComponents = {
  Tabs: dynamic(() => import('./ui/tabs').then((mod) => ({ default: mod.Tabs })), {
    loading: () => <div className="w-full h-10 bg-card/50 rounded-lg animate-pulse" />,
  }),
  TabsContent: dynamic(() => import('./ui/tabs').then((mod) => ({ default: mod.TabsContent })), {
    loading: () => <div className="w-full min-h-96 bg-card/50 rounded-lg animate-pulse" />,
  }),
  TabsList: dynamic(() => import('./ui/tabs').then((mod) => ({ default: mod.TabsList })), {
    loading: () => <div className="w-full h-10 bg-card/50 rounded-lg animate-pulse" />,
  }),
  TabsTrigger: dynamic(() => import('./ui/tabs').then((mod) => ({ default: mod.TabsTrigger })), {
    loading: () => <div className="w-16 h-8 bg-card/50 rounded animate-pulse" />,
  }),
};

// Content loaders using content processor (dynamic GitHub API fetching)
export const lazyContentLoaders = {
  agents: async () => {
    const { contentProcessor } = await import('@/lib/services/content-processor.service');
    return contentProcessor.getContentByCategory('agents');
  },
  mcp: async () => {
    const { contentProcessor } = await import('@/lib/services/content-processor.service');
    return contentProcessor.getContentByCategory('mcp');
  },
  rules: async () => {
    const { contentProcessor } = await import('@/lib/services/content-processor.service');
    return contentProcessor.getContentByCategory('rules');
  },
  commands: async () => {
    const { contentProcessor } = await import('@/lib/services/content-processor.service');
    return contentProcessor.getContentByCategory('commands');
  },
  hooks: async () => {
    const { contentProcessor } = await import('@/lib/services/content-processor.service');
    return contentProcessor.getContentByCategory('hooks');
  },
};

// Create lazy-loaded content chunks for better performance
export function createLazyContentLoader<T>(
  loader: () => Promise<T>,
  fallback: T
): () => Promise<T> {
  let cached: T | null = null;
  let loading: Promise<T> | null = null;

  return async () => {
    if (cached) return cached;
    if (loading) return loading;

    loading = loader()
      .then((result) => {
        cached = result;
        loading = null;
        return result;
      })
      .catch(() => {
        loading = null;
        return fallback;
      });

    return loading;
  };
}
