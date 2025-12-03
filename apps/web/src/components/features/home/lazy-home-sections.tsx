import { spaceY, marginBottom , gap , padding , radius,   bgColor,
  display,
  flexGrow,
} from '@heyclaude/web-runtime/design-system';
import dynamic from 'next/dynamic';
import { FeaturedSectionSkeleton, Skeleton } from '@heyclaude/web-runtime/ui';

// Re-export section prop types so consumers can name the inferred component types without TS4023 issues.
export type { FeaturedSectionsProps } from '@/src/components/features/home/featured-sections';
export type { SearchSectionProps } from '@/src/components/features/home/homepage-search';
export type { TabsSectionProps } from '@/src/components/features/home/homepage-tabs';

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
      <div className={`${marginBottom.hero} ${spaceY.loose}`}>
        {/* 5 featured categories + 1 jobs section */}
        {[...Array(6)].map((_, i) => (
          <FeaturedSectionSkeleton key={`featured-loading-${i + 1}`} />
        ))}
      </div>
    ),
    ssr: true, // SSR enabled: Better UX and SEO, content rendered immediately
  }
);

/**
 * Lazy-loaded TabsSection with skeleton loading state
 * OPTIMIZATION (2025-10-22): Enabled SSR for better perceived performance
 * SSR renders tabs immediately, eliminating skeleton flash
 * Interactive functionality works client-side after hydration
 */
export const LazyTabsSection = dynamic(
  () =>
    import('@/src/components/features/home/homepage-tabs').then((mod) => ({
      default: mod.TabsSection,
    })),
  {
    loading: () => (
      <div className={spaceY.loose}>
        {/* Tabs skeleton */}
        <div className={`${display.flex} ${gap.compact} ${radius.lg} ${bgColor.muted} ${padding.micro}`}>
          {[...Array(7)].map((_, i) => (
            <Skeleton key={`tab-skeleton-${i + 1}`} size="lg" width="3xl" className={flexGrow['1']} />
          ))}
        </div>
        {/* Content skeleton */}
        <FeaturedSectionSkeleton />
      </div>
    ),
    ssr: true, // SSR enabled: Better UX, tabs render immediately
  }
);

/**
 * Lazy-loaded SearchSection with skeleton loading state
 */
export const LazySearchSection = dynamic(
  () =>
    import('@/src/components/features/home/homepage-search').then((mod) => ({
      default: mod.SearchSection,
    })),
  {
    loading: () => null, // SearchSection is conditionally rendered, no skeleton needed
    ssr: true,
  }
);
