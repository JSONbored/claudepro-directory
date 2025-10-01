import { ConfigGridSkeleton, LoadingSkeleton } from '@/components/ui/loading-skeleton';

/**
 * Loading Component Factory
 * SHA-2101: Replaces 7 duplicate loading.tsx files with single factory
 *
 * Usage in app/[category]/loading.tsx:
 * export { CategoryLoading as default } from '@/lib/components/loading-factory';
 */

/**
 * Category pages loading component
 * Used for: /agents, /mcp, /hooks, /rules, /commands, /jobs
 */
export function CategoryLoading() {
  return <ConfigGridSkeleton />;
}

/**
 * Default/home page loading component
 * Used for: / (homepage)
 */
export function DefaultLoading() {
  return <LoadingSkeleton />;
}
