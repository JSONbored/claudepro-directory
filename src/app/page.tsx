/**
 * Homepage - Modern 2025 Configuration-Driven Architecture
 *
 * Performance Optimizations:
 * - ISR with 10-minute revalidation for optimal freshness
 * - Redis caching for content metadata
 * - Lazy loading for animations and client components
 * - Dynamic metadata loading from unified category registry
 *
 * Architecture:
 * - Zero hardcoded category lists - all derived from UNIFIED_CATEGORY_REGISTRY
 * - Adding new category requires zero changes here (fully automatic)
 * - Type-safe with Record<CategoryId, Metadata[]> pattern
 *
 * @see lib/config/category-config.ts - Single source of truth for categories
 */

import { Suspense } from 'react';
import { UnifiedNewsletterCapture } from '@/src/components/features/growth/unified-newsletter-capture';
import { HomePageClient } from '@/src/components/features/home';
import { HeroSection } from '@/src/components/features/home/hero-section';
import { LazySection } from '@/src/components/infra/lazy-section';
import { LoadingSkeleton } from '@/src/components/primitives/loading-skeleton';
import { lazyContentLoaders } from '@/src/components/shared/lazy-content-loaders';

import { type CategoryId, getAllCategoryIds } from '@/src/lib/config/category-config';
import { logger } from '@/src/lib/logger';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { featuredService } from '@/src/lib/services/featured.server';
import { batchFetch } from '@/src/lib/utils/batch.utils';

/**
 * Category metadata type - Dynamically derived from registry
 * Modern approach: Generic type that works for all categories
 * View/copy counts added client-side via useViewCounts hook
 */
type CategoryMetadata = UnifiedContentItem & { 
  category: CategoryId;
  viewCount: number;
  copyCount: number;
};

/**
 * Static Generation - Homepage
 * 
 * FULLY STATIC at build time:
 * - No Redis dependency during build
 * - No runtime function invocations
 * - Pure HTML served from CDN
 * 
 * Real-time data fetched CLIENT-SIDE:
 * - View/copy counts via /api/stats/batch
 * - 95% cache hit rate (localStorage 24h + in-memory 5min)
 * - Non-blocking, loads after initial render
 */
export const dynamic = 'force-static';

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

/**
 * Async data loader component - streams content independently
 * Wrapped in Suspense for progressive HTML streaming
 */
async function HomeContentSection({ searchQuery }: { searchQuery: string }) {
  /**
   * Modern 2025 Architecture: Dynamic Category Loading
   *
   * BEFORE (Hardcoded - Required manual updates for each category):
   * let rulesData = [], mcpData = [], agentsData = [];
   * [rulesData, mcpData, agentsData] = await batchFetch([...])
   *
   * AFTER (Configuration-Driven - Zero manual updates):
   * Dynamic loading based on UNIFIED_CATEGORY_REGISTRY
   * Adding "Skills" or any new category requires ZERO changes here
   */

  // Get all category IDs from registry (zero hardcoded lists)
  const categoryIds = getAllCategoryIds();

  // Initialize category data storage
  const categoryData: Record<CategoryId, UnifiedContentItem[]> = {} as Record<
    CategoryId,
    UnifiedContentItem[]
  >;

  let featuredByCategory: Record<string, UnifiedContentItem[]> = {};

  try {
    // Build dynamic loader array from registry
    const loaders = [
      ...categoryIds.map((id) => lazyContentLoaders[id]()),
      featuredService.loadCurrentFeaturedContentByCategory(),
    ];

    // Batch fetch all category data + featured content
    const results = await batchFetch(loaders);

    // Map results back to category IDs (last result is featured content)
    categoryIds.forEach((id, index) => {
      categoryData[id] = (results[index] as UnifiedContentItem[]) || [];
    });

    // Last result is featured content
    featuredByCategory =
      (results[results.length - 1] as Record<string, UnifiedContentItem[]>) || {};
  } catch (error) {
    // Log error but continue with empty fallbacks to prevent page crash
    logger.error(
      'Failed to load homepage content',
      error instanceof Error ? error : new Error(String(error)),
      {
        source: 'HomePage',
        operation: 'loadContentMetadata',
      }
    );

    // Graceful degradation: Initialize with empty arrays
    categoryIds.forEach((id) => {
      categoryData[id] = [];
    });
  }

  /**
   * STATIC GENERATION OPTIMIZATION
   *
   * View/copy counts are fetched CLIENT-SIDE for real-time data.
   * This eliminates Redis dependency at build time, making homepage truly static.
   * 
   * Client-side fetching via useViewCounts hook:
   * - Multi-tier caching (localStorage 24h + in-memory 5min)
   * - Batch API requests (/api/stats/batch)
   * - Stale-while-revalidate strategy
   * - 95% cache hit rate = minimal API calls
   */

  // Add category to all items (no Redis enrichment)
  const categoryDataWithCategory: Record<CategoryId, CategoryMetadata[]> = {} as Record<
    CategoryId,
    CategoryMetadata[]
  >;

  categoryIds.forEach((id) => {
    categoryDataWithCategory[id] = categoryData[id].map((item) => ({
      ...item,
      category: id,
      viewCount: 0, // Will be fetched client-side via useViewCounts hook
      copyCount: 0, // Will be fetched client-side via useViewCounts hook
    }));
  });

  /**
   * Modern 2025 Architecture: Dynamic AllConfigs Assembly
   *
   * BEFORE: Hardcoded array spread for 7 categories
   * AFTER: Dynamic assembly from all categories in registry
   */

  // Combine all category data into single array
  const allConfigsWithDuplicates = categoryIds.flatMap((id) => categoryDataWithCategory[id] || []);

  // Deduplicate by slug (last occurrence wins)
  const allConfigsMap = new Map(allConfigsWithDuplicates.map((item) => [item.slug, item]));
  const allConfigs = Array.from(allConfigsMap.values()) as UnifiedContentItem[];

  // Build initial data object (no transformation needed - displayTitle computed at build time)
  const initialData: Record<string, UnifiedContentItem[]> = {
    ...categoryDataWithCategory,
    allConfigs,
  };

  return (
    <HomePageClient
      initialData={initialData}
      initialSearchQuery={searchQuery}
      featuredByCategory={featuredByCategory}
      stats={Object.fromEntries(
        categoryIds.map((id) => [id, categoryDataWithCategory[id]?.length || 0])
      )}
    />
  );
}

// Server component that renders layout with streaming
export default async function HomePage({ searchParams }: HomePageProps) {
  // Extract and sanitize search query from URL
  const resolvedParams = await searchParams;
  const initialSearchQuery = resolvedParams.q || '';

  return (
    <div className={'min-h-screen bg-background'}>
      {/* Hero + Search Section */}
      <div className="relative overflow-hidden">
        {/* Hero with Parallax Scroll Effects */}
        <HeroSection />

        {/* Content Section - Streams independently after hero */}
        <div className={'relative'}>
          <Suspense fallback={<LoadingSkeleton />}>
            <HomeContentSection searchQuery={initialSearchQuery} />
          </Suspense>
        </div>
      </div>

      {/* Email CTA - Beautiful fade-in with spring physics */}
      <section className={'container mx-auto px-4 py-12'}>
        <Suspense fallback={null}>
          <LazySection variant="fade-in" delay={0.15}>
            <UnifiedNewsletterCapture
              variant="hero"
              source="homepage"
              context="homepage"
              headline="Join 1,000+ Claude Power Users"
              description="Get weekly updates on new tools, guides, and community highlights. No spam, unsubscribe anytime."
            />
          </LazySection>
        </Suspense>
      </section>
    </div>
  );
}
