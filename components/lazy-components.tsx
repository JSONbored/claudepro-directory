import dynamic from 'next/dynamic';

// Generate stable keys for skeleton items (prevents unnecessary re-renders)
const SKELETON_KEYS = Array.from({ length: 6 }, () => crypto.randomUUID());

// Lazy load heavy components with proper loading states
export const LazyUnifiedSearch = dynamic(
  () => import('./unified-search').then((mod) => ({ default: mod.UnifiedSearch })),
  {
    loading: () => <div className="w-full h-12 bg-card/50 rounded-lg animate-pulse" />,
    ssr: false,
  }
);

export const LazyInfiniteScrollContainer = dynamic(
  () =>
    import('./infinite-scroll-container').then((mod) => ({ default: mod.InfiniteScrollContainer })),
  {
    loading: () => (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {SKELETON_KEYS.map((key) => (
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
);

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

// Chunk heavy data imports by category
export const lazyContentLoaders = {
  agents: () => import('../generated/agents-metadata').then((m) => m.agentsMetadata),
  mcp: () => import('../generated/mcp-metadata').then((m) => m.mcpMetadata),
  rules: () => import('../generated/rules-metadata').then((m) => m.rulesMetadata),
  commands: () => import('../generated/commands-metadata').then((m) => m.commandsMetadata),
  hooks: () => import('../generated/hooks-metadata').then((m) => m.hooksMetadata),
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
