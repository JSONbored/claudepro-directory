import { FeaturedSectionSkeleton, Skeleton } from '@heyclaude/web-runtime/ui';
import dynamic from 'next/dynamic';

// Re-export section prop types so consumers can name the inferred component types without TS4023 issues.
export type { FeaturedSectionsProps } from '@/src/components/features/home/featured-sections';
export type { AllContentSectionProps } from '@/src/components/features/home/all-content-section';

/**
 * Lazy-loaded FeaturedSections with skeleton loading state
 * OPTIMIZATION (2025-10-22): Enabled SSR for better perceived performance and SEO
 * SSR renders content immediately, eliminating skeleton flash
 * Code-splitting still reduces initial bundle by ~15-20KB
 */
export const LazyFeaturedSections = dynamic(
  () =>
    import('@/src/components/features/home/featured-sections').then((mod) => ({
      default: mod.FeaturedSections,
    })),
  {
    loading: () => (
      <div className="mb-16 space-y-3">
        {/* 5 featured categories + 1 jobs section */}
        {Array.from({ length: 6 }).map((_, i) => (
          <FeaturedSectionSkeleton key={`featured-loading-${i + 1}`} />
        ))}
      </div>
    ),
    ssr: true, // SSR enabled: Better UX and SEO, content rendered immediately
  }
);

/**
 * Lazy-loaded AllContentSection with skeleton loading state
 * OPTIMIZATION: Scroll-triggered loading - only fetches when section enters viewport
 * This eliminates function calls for users who don't scroll to this section
 */
export const LazyAllContentSection = dynamic(
  () =>
    import('@/src/components/features/home/all-content-section').then((mod) => ({
      default: mod.AllContentSection,
    })),
  {
    loading: () => (
      <div className="space-y-12">
        {/* Section header skeleton */}
        <div className="mb-8">
          <Skeleton size="lg" width="3xl" className="mb-2 h-8 w-64" />
          <Skeleton size="md" width="2xl" className="h-4 w-96" />
        </div>
        {/* Content skeleton */}
        <FeaturedSectionSkeleton />
      </div>
    ),
    ssr: false, // Client-only: Uses Intersection Observer for scroll-triggered loading
  }
);

/**
 * SearchSection - REMOVED
 *
 * Search results are now handled by the unified SearchResults component
 * from @heyclaude/web-runtime/search, which is integrated via SearchProvider.
 */
