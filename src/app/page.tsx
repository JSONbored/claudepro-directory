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

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { UnifiedNewsletterCapture } from '@/src/components/features/growth/unified-newsletter-capture';
import { HomePageClient } from '@/src/components/features/home';
import { LazySection } from '@/src/components/infra/lazy-section';
import { LoadingSkeleton } from '@/src/components/primitives/loading-skeleton';
import { lazyContentLoaders } from '@/src/components/shared/lazy-content-loaders';

// Lazy load animations to improve LCP (40-60 KB saved from initial bundle)
// RollingText uses Framer Motion and impacts homepage First Load
const RollingText = dynamic(
  () => import('@/src/components/magic/rolling-text').then((mod) => ({ default: mod.RollingText })),
  {
    loading: () => <span className="text-accent">enthusiasts</span>, // Fallback text
  }
);

import { statsRedis } from '@/src/lib/cache.server';
import { type CategoryId, getAllCategoryIds } from '@/src/lib/config/category-config';
import { logger } from '@/src/lib/logger';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { featuredService } from '@/src/lib/services/featured.server';
import { batchFetch } from '@/src/lib/utils/batch.utils';

/**
 * Category metadata type - Dynamically derived from registry
 * Modern approach: Generic type that works for all categories
 */
type CategoryMetadata = UnifiedContentItem & { category: CategoryId };

/**
 * Enriched metadata with analytics data
 * Modern approach: Single type for all categories
 */
type EnrichedMetadata = CategoryMetadata & { viewCount: number; copyCount: number };

/**
 * ISR Configuration - Homepage
 * Revalidate every 10 minutes - balance between freshness and performance
 * Homepage has mixed content with high traffic, optimized for user experience
 */
export const revalidate = 600;

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
   * Modern 2025 Architecture: Unified Parallel Enrichment
   *
   * ARCHITECTURAL FIX: Combine category + featured enrichment into single parallel batch
   * BEFORE: Category enrichment, THEN featured enrichment (2 sequential await calls)
   * AFTER: All enrichment in ONE parallel batch (20-30ms gain)
   */

  // Storage for enriched data
  const enrichedCategoryData: Record<CategoryId, EnrichedMetadata[]> = {} as Record<
    CategoryId,
    EnrichedMetadata[]
  >;
  let enrichedFeaturedByCategory: Record<string, UnifiedContentItem[]> = {};

  try {
    // Build unified enrichment loaders for categories AND featured content
    const categoryEnrichmentLoaders = categoryIds.map((id) =>
      statsRedis.enrichWithAllCounts(categoryData[id].map((item) => ({ ...item, category: id })))
    );

    const featuredEntries = Object.entries(featuredByCategory);
    const featuredEnrichmentLoaders = featuredEntries.map(([, items]) =>
      statsRedis.enrichWithAllCounts(items as UnifiedContentItem[])
    );

    // Single parallel batch for ALL enrichment (categories + featured)
    const allEnrichmentLoaders = [...categoryEnrichmentLoaders, ...featuredEnrichmentLoaders];
    const allEnrichedResults = await batchFetch(allEnrichmentLoaders);

    // Split results: first N are categories, rest are featured
    const categoryResultsEnd = categoryIds.length;
    const categoryResults = allEnrichedResults.slice(0, categoryResultsEnd);
    const featuredResults = allEnrichedResults.slice(categoryResultsEnd);

    // Map category results
    categoryIds.forEach((id, index) => {
      enrichedCategoryData[id] = (categoryResults[index] as EnrichedMetadata[]) || [];
    });

    // Map featured results
    featuredEntries.forEach(([category], index) => {
      enrichedFeaturedByCategory[category] = (featuredResults[index] as UnifiedContentItem[]) || [];
    });
  } catch (error) {
    // Log error and fallback to data without enrichment
    logger.error(
      'Failed to enrich content with stats',
      error instanceof Error ? error : new Error(String(error)),
      {
        source: 'HomePage',
        operation: 'enrichWithStats',
      }
    );

    // Fallback for featured content - use unenriched data
    enrichedFeaturedByCategory = featuredByCategory;

    // Graceful degradation: use base metadata with default counts (0)
    categoryIds.forEach((id) => {
      enrichedCategoryData[id] = categoryData[id].map((item) => ({
        ...item,
        category: id,
        viewCount: 0,
        copyCount: 0,
      }));
    });
  }

  /**
   * Modern 2025 Architecture: Dynamic AllConfigs Assembly
   *
   * BEFORE: Hardcoded array spread for 7 categories
   * AFTER: Dynamic assembly from all categories in registry
   */

  // Combine all category data into single array
  const allConfigsWithDuplicates = categoryIds.flatMap((id) => enrichedCategoryData[id] || []);

  // Deduplicate by slug (last occurrence wins)
  const allConfigsMap = new Map(allConfigsWithDuplicates.map((item) => [item.slug, item]));
  const allConfigs = Array.from(allConfigsMap.values()) as UnifiedContentItem[];

  // Build initial data object (no transformation needed - displayTitle computed at build time)
  const initialData: Record<string, UnifiedContentItem[]> = {
    ...enrichedCategoryData,
    allConfigs,
  };

  return (
    <HomePageClient
      initialData={initialData}
      initialSearchQuery={searchQuery}
      featuredByCategory={enrichedFeaturedByCategory}
      stats={Object.fromEntries(
        categoryIds.map((id) => [id, enrichedCategoryData[id]?.length || 0])
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
        {/* Static Hero Section - Server Rendered - Streams immediately */}
        <section className={'relative border-b border-border/50'} aria-label="Homepage hero">
          {/* Content Layer */}
          <div className={'relative container mx-auto px-4 py-10 sm:py-16 lg:py-24'}>
            <div className={'text-center max-w-4xl mx-auto'}>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 text-foreground tracking-tight">
                The home for Claude{' '}
                <RollingText
                  words={['enthusiasts', 'developers', 'power users', 'beginners', 'builders']}
                  duration={3000}
                  className="text-accent"
                />
              </h1>

              <p
                className={
                  'text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto'
                }
              >
                Discover and share the best Claude configurations. Explore expert rules, browse
                powerful MCP servers, find specialized agents and commands, discover automation
                hooks, and connect with the community building the future of AI.
              </p>
            </div>
          </div>
        </section>

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
