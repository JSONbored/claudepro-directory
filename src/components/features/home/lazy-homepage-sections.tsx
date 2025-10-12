import dynamic from 'next/dynamic';
import { FeaturedSectionSkeleton } from '@/src/components/ui/loading-skeleton';

/**
 * Lazy-loaded FeaturedSections with skeleton loading state
 * Prevents CLS by reserving space during load
 */
export const LazyFeaturedSections = dynamic(
  () =>
    import('@/src/components/features/home/featured-sections').then((mod) => ({
      default: mod.FeaturedSections,
    })),
  {
    loading: () => (
      <div className="space-y-16 mb-16">
        {/* 5 featured categories + 1 jobs section */}
        {[...Array(6)].map((_, i) => (
          <FeaturedSectionSkeleton key={`featured-loading-${i + 1}`} />
        ))}
      </div>
    ),
    ssr: true, // Server-render for SEO
  }
);

/**
 * Lazy-loaded TabsSection with skeleton loading state
 */
export const LazyTabsSection = dynamic(
  () =>
    import('@/src/components/features/home/tabs-section').then((mod) => ({
      default: mod.TabsSection,
    })),
  {
    loading: () => (
      <div className="space-y-8">
        {/* Tabs skeleton */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg animate-pulse">
          {[...Array(7)].map((_, i) => (
            <div key={`tab-skeleton-${i + 1}`} className="h-10 bg-background rounded-md flex-1" />
          ))}
        </div>
        {/* Content skeleton */}
        <FeaturedSectionSkeleton />
      </div>
    ),
    ssr: true, // Server-render for SEO
  }
);

/**
 * Lazy-loaded SearchSection with skeleton loading state
 */
export const LazySearchSection = dynamic(
  () =>
    import('@/src/components/features/home/search-section').then((mod) => ({
      default: mod.SearchSection,
    })),
  {
    loading: () => null, // SearchSection is conditionally rendered, no skeleton needed
    ssr: true,
  }
);
