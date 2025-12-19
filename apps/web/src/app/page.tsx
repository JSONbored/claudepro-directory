/** Homepage consuming homepageConfigs for runtime-tunable categories */

import { type content_category, type user_tier } from '@heyclaude/data-layer/prisma';
import { getAuthenticatedUser } from '@heyclaude/web-runtime/auth/get-authenticated-user';
import { isBookmarkedBatch } from '@heyclaude/web-runtime/data/account';
import { getHomepageCategoryIds } from '@heyclaude/web-runtime/data/config/category';
import { getHomepageData } from '@heyclaude/web-runtime/data/content/homepage';
import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';
import { trackRPCFailure } from '@heyclaude/web-runtime/utils/homepage-error-tracking';
import { type Metadata } from 'next';
// Suspense removed - not needed since data is fetched at page level
// Suspense above the fold can cause blank states to be cached

import { LazySection } from '@/src/components/core/infra/scroll-animated-section';
import { TopContributors } from '@/src/components/features/community/top-contributors';
import { HeroSearchConnectionProvider } from '@/src/components/features/home/hero-search-connection';
import { HomepageContentServer } from '@/src/components/features/home/homepage-content-server';
import { HomepageHeroServer } from '@/src/components/features/home/homepage-hero-server';
import { HomepageSearchProvider } from '@/src/components/features/home/homepage-search-provider';

/**
 * Generate metadata for the root page, deferring execution until request time.
 *
 * Awaits the request-scoped connection to satisfy Cache Component requirements for non-deterministic operations, then produces page metadata for '/'.
 *
 * @returns Page metadata for the root path (`'/'`) as a `Metadata` object.
 *
 * @see generatePageMetadata
 * @see connection
 */
export async function generateMetadata(): Promise<Metadata> {
  // NOTE: 'use cache' removed - generatePageMetadata may use dynamic data sources
  // Metadata generation is already optimized at the SEO layer
  return generatePageMetadata('/');
}

interface HomePageProperties {
  searchParams: Promise<{
    q?: string;
  }>;
}

/**
 * REMOVED: TopContributorsServer component
 *
 * This component previously fetched homepage data separately, causing duplicate function calls.
 * Data is now fetched once at the page level and passed as props to TopContributors (New Community Members).
 *
 * @see HomePage - Now handles data fetching and passes new community members as props
 */

/**
 * Render the homepage using streaming Suspense boundaries to enable progressive rendering.
 *
 * OPTIMIZATION: Fetches homepage data once and passes it to child components as props.
 * This reduces function calls from 3 to 1 (66% reduction in function usage).
 *
 * Awaits connection() to establish request-time dynamic context before resolving non-deterministic data and the provided `searchParams`. Streams the hero, search facets, and main content independently and lazy-loads below-the-fold sections (e.g., new community members).
 *
 * @param searchParams - A promise that resolves to the page's query parameters (object with optional `q` string)
 * @param searchParams.searchParams
 * @returns The homepage React element composed of streaming Suspense boundaries and lazy-loaded sections
 *
 * @see HomepageHeroServer
 * @see HomepageContentServer
 * @see TopContributors (New Community Members)
 * @see getHomepageData
 * @see trackRPCFailure
 */
export default async function HomePage({ searchParams: _searchParams }: HomePageProperties) {
  // NOTE: 'use cache' removed because this page uses getAuthenticatedUser() which calls cookies()
  // cookies() cannot be used inside 'use cache' functions per Next.js requirements
  // The page will still benefit from caching at the component level where appropriate

  // CRITICAL OPTIMIZATION: Fetch homepage data ONCE at page level
  // This eliminates 3 separate function calls (hero, content, contributors)

  const categoryIds = getHomepageCategoryIds; // Constant array, not a function call
  const homepageResult = await getHomepageData(categoryIds).catch((error: unknown) => {
    trackRPCFailure('get_homepage_optimized', error, {
      categoryIds: categoryIds.length,
      section: 'homepage',
    });
    return null;
  });

  // Extract data for hero section
  const memberCount = homepageResult?.member_count ?? 0;

  // OPTIMIZATION: Early return pattern for stats extraction
  let stats: Record<string, number | { featured: number; total: number }> = {};
  if (
    homepageResult?.content &&
    typeof homepageResult.content === 'object' &&
    !Array.isArray(homepageResult.content)
  ) {
    const content = homepageResult.content;
    if ('stats' in content && typeof content['stats'] === 'object' && content['stats'] !== null) {
      stats = content['stats'] as Record<string, number | { featured: number; total: number }>;
    }
  }

  // Extract new community members data
  interface TopContributor {
    bio: null | string;
    created_at?: Date | null | string;
    id: string;
    image: null | string;
    name: string;
    slug: string;
    tier: null | user_tier;
    work: null | string;
  }

  // OPTIMIZATION: Memoize new community members processing to avoid recreating on every render
  // This is a server component, but we still want efficient processing
  const topContributorsRaw = homepageResult?.top_contributors;
  const topContributors = (Array.isArray(topContributorsRaw) ? topContributorsRaw : [])
    .filter(
      (c: unknown): c is TopContributor =>
        typeof c === 'object' &&
        c !== null &&
        !Array.isArray(c) &&
        'id' in c &&
        'slug' in c &&
        'name' in c &&
        Boolean(
          (c as Record<string, unknown>)['id'] &&
          (c as Record<string, unknown>)['slug'] &&
          (c as Record<string, unknown>)['name']
        )
    )
    .map((contributor: TopContributor) => {
      // OPTIMIZATION: Simplified created_at conversion (reduces object checks)
      const created_at: string =
        contributor.created_at instanceof Date
          ? contributor.created_at.toISOString()
          : typeof contributor.created_at === 'string'
            ? contributor.created_at
            : '';

      return {
        bio: contributor.bio,
        created_at,
        id: contributor.id,
        image: contributor.image,
        name: contributor.name,
        slug: contributor.slug,
        tier: contributor.tier ?? 'free',
        work: contributor.work,
      };
    });

  // CRITICAL OPTIMIZATION: Batch check bookmark status for all homepage items
  // This eliminates 48 individual status checks (8 categories × 6 items) → 1 batch call
  // Only check if user is authenticated (unauthenticated users don't have bookmarks)
  let bookmarkStatusMap = new Map<string, boolean>();
  const authResult = await getAuthenticatedUser({
    context: 'HomePage',
    requireUser: false, // Optional auth - don't throw if not authenticated
  });

  if (authResult.isAuthenticated && authResult.user) {
    try {
      // OPTIMIZATION: Collect all items efficiently with early returns
      const allItems: Array<{ content_slug: string; content_type: content_category }> = [];

      if (
        homepageResult?.content &&
        typeof homepageResult.content === 'object' &&
        !Array.isArray(homepageResult.content)
      ) {
        const content = homepageResult.content;
        const categoryData = content['categoryData'];

        if (
          categoryData &&
          typeof categoryData === 'object' &&
          categoryData !== null &&
          !Array.isArray(categoryData)
        ) {
          // OPTIMIZATION: Use Object.entries with early validation
          for (const [categoryKey, items] of Object.entries(categoryData)) {
            if (!Array.isArray(items) || !isValidCategory(categoryKey)) continue;

            // Validate using isValidCategory (which uses Prisma enum), then narrow type
            if (!isValidCategory(categoryKey)) continue;
            const category = categoryKey; // isValidCategory ensures type safety

            // OPTIMIZATION: Use for...of with early continue for better performance
            for (const item of items) {
              if (!item || typeof item !== 'object' || !('slug' in item)) continue;

              const slug = item.slug;
              if (typeof slug === 'string' && slug) {
                allItems.push({ content_slug: slug, content_type: category });
              }
            }
          }
        }
      }

      // Only call batch check if we have items to check
      if (allItems.length > 0) {
        const batchResults = await isBookmarkedBatch({
          items: allItems,
          userId: authResult.user.id,
        });

        // Convert results array to Map for O(1) lookup
        // Results format: [{ content_type, content_slug, is_bookmarked }]
        if (Array.isArray(batchResults)) {
          bookmarkStatusMap = new Map(
            batchResults.map((row) => [
              `${row.content_type}:${row.content_slug}`,
              row.is_bookmarked ?? false,
            ])
          );
        }
      }
    } catch (error) {
      // Log error but don't fail page render - bookmark status is non-critical
      const { logger, normalizeError } = await import('@heyclaude/shared-runtime/logger/index');
      const normalized = normalizeError(error, 'Bookmark status batch check failed');
      logger.warn({
        err: normalized,
        module: 'apps/web/src/app/page',
        operation: 'HomePage',
        route: '/',
      });
      // Continue with empty map - buttons will default to false
    }
  }

  return (
    <HeroSearchConnectionProvider>
      <HomepageSearchProvider>
        <div className="bg-background min-h-screen">
          <div className="relative overflow-hidden">
            {/* Hero section - now receives data as props instead of fetching */}
            <HomepageHeroServer memberCount={memberCount} stats={stats} />

            {/* Homepage content - now receives data as props instead of fetching */}
            {/* CRITICAL: No Suspense above the fold - data is already fetched, prevents blank states from being cached */}
            <div className="relative">
              <HomepageContentServer
                bookmarkStatusMap={bookmarkStatusMap}
                categoryIds={categoryIds}
                homepageResult={homepageResult}
              />
            </div>

            {/* Search facets - loaded separately in parallel, optional for homepage content */}
            {/* Note: Search facets are now optional and loaded separately to avoid blocking content */}

            {/* New Community Members - lazy loaded below fold, now receives data as props */}
            <LazySection rootMargin="0px 0px -500px 0px">
              <TopContributors contributors={topContributors} />
            </LazySection>
          </div>
        </div>
      </HomepageSearchProvider>
    </HeroSearchConnectionProvider>
  );
}

/**
 * REMOVED: HomepageHeroWithMemberCount component
 *
 * This component previously fetched homepage data separately, causing duplicate function calls.
 * Data is now fetched once at the page level and passed as props to HomepageHeroServer.
 *
 * @see HomePage - Now handles data fetching and passes memberCount/stats as props
 */

/**
 * Resolves provided search filter options and renders HomepageContentServer with those filters.
 *
 * This server-side wrapper ensures the `searchFiltersPromise` is fulfilled before rendering the content
 * server, preventing the child component from rendering without the required search filters.
 *
 * @param props.searchFiltersPromise - A promise that resolves to the search filter options to pass to HomepageContentServer.
 *
 * @param root0
 * @param root0.searchFiltersPromise
 * @see HomepageContentServer
 * @see SearchFilterOptions
 
 * @returns {Promise<unknown>} Description of return value*/
