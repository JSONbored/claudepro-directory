'use client';

/** Homepage client consuming homepageConfigs for runtime-tunable featured categories */

import type { content_category } from '@heyclaude/data-layer/prisma';
import { getHomepageConfigBundle } from '@heyclaude/web-runtime/config/static-configs';
import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';
import { trackMissingData } from '@heyclaude/web-runtime/utils/homepage-error-tracking';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { SearchResults } from '@heyclaude/web-runtime/search/components/search-results';
import { useSearchContext } from '@heyclaude/web-runtime/search/context/search-provider';
import {
  type DisplayableContent,
  type HomePageClientProps,
} from '@heyclaude/web-runtime/types/component.types';
import { useAuthModal } from '@/src/hooks/use-auth-modal';
import { usePathname } from 'next/navigation';
import { Suspense, memo, useEffect, useMemo, useState } from 'react';

import {
  LazyFeaturedSections,
  LazyAllContentSection,
} from '@/src/components/features/home/lazy-home-sections';
import { getCategoryConfigs } from '@heyclaude/web-runtime/data/config/category';

/**
 * Inner component that uses search context
 */
function HomePageClientContent({
  initialData,
  stats,
  featuredJobs = [],
  weekStart,
  serverCategoryIds,
  bookmarkStatusMap = {},
}: HomePageClientProps) {
  const { query } = useSearchContext();
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();

  // Category stats config removed - now in hero section

  // Initialize featuredCategories from server data immediately
  // This ensures content renders even if static config is unavailable
  const [featuredCategories, setFeaturedCategories] = useState<
    readonly content_category[]
  >(() => {
    // First, try using keys from initialData (most reliable - these are categories that have data)
    // Validate categories using isValidCategory (which uses Prisma enum)
    // Type guard: isValidCategory ensures type safety, no assertion needed
    const categoriesFromData = Object.keys(initialData).filter(
      (cat): cat is content_category => {
        const data = initialData[cat];
        return Array.isArray(data) && data.length > 0 && isValidCategory(cat);
      }
    );

    if (categoriesFromData.length > 0) {
      return categoriesFromData;
    }

    // Fallback: Use server-provided categoryIds if initialData is empty (shouldn't happen, but defensive)
    // Validate serverCategoryIds using isValidCategory
    if (serverCategoryIds && serverCategoryIds.length > 0) {
      // Type guard: isValidCategory ensures type safety, no assertion needed
      const validServerCategories = serverCategoryIds.filter(
        (cat): cat is content_category => isValidCategory(cat)
      );
      if (validServerCategories.length > 0) {
        return validServerCategories;
      }
    }

    // Final fallback: empty array
    return [];
  });

  // OPTIMIZATION: Memoize category configs to avoid recreating on every render
  // React Compiler will automatically optimize this, but explicit memoization ensures stability
  const categoryConfigs = useMemo(() => getCategoryConfigs(), []);

  // OPTIMIZATION: Defer non-critical tracking to avoid blocking initial render
  // Use requestIdleCallback to defer tracking until browser is idle
  useEffect(() => {
    if (stats && Object.keys(stats).length === 0) {
      const trackMissing = () => {
        trackMissingData('stats', 'stats-data', {
          note: 'Stats data is empty',
        });
      };
      
      // Defer to idle time to avoid blocking main thread
      if ('requestIdleCallback' in globalThis) {
        requestIdleCallback(trackMissing, { timeout: 5000 });
      } else {
        // Fallback: defer with setTimeout
        setTimeout(trackMissing, 100);
      }
    }
  }, [stats]);

  // OPTIMIZATION: Memoize config bundle loading to avoid recreating on every render
  // Get static config bundle
  const configBundle = useMemo(() => {
    try {
      return getHomepageConfigBundle();
    } catch (error) {
      // OPTIMIZATION: Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        const normalized = normalizeError(error, 'Failed to load homepage config bundle');
        logClientWarn(
          '[Home] Failed to load homepage config bundle',
          normalized,
          'HomePageClient.loadConfigBundle',
          {
            component: 'HomePageClient',
            action: 'load-config-bundle',
            category: 'home',
          }
        );
      }
      return null;
    }
  }, []);

  // OPTIMIZATION: Memoize category extraction from config bundle
  const configCategories = useMemo(() => {
    return Array.isArray(configBundle?.homepageConfig?.['homepage.featured_categories'])
      ? configBundle.homepageConfig['homepage.featured_categories']
      : [];
  }, [configBundle]);

  // OPTIMIZATION: Use initialData directly (featuredByCategory removed to reduce RSC payload)
  // This eliminates duplicate data serialization (~50% reduction in homepage RSC payload)
  const featuredData = useMemo(() => {
    return initialData;
  }, [initialData]);

  // OPTIMIZATION: Memoize categories object passed to LazyFeaturedSections
  const categoriesForSections = useMemo(() => {
    if (featuredData && typeof featuredData === 'object' && !Array.isArray(featuredData)) {
      return featuredData as Record<string, readonly DisplayableContent[]>;
    }
    return {} as Record<string, readonly DisplayableContent[]>;
  }, [featuredData]);

  // OPTIMIZATION: Memoize category filtering to avoid recreating on every render
  // Use static categories if available, otherwise fall back to server-provided categoryIds
  // Filter to only include categories that have data in initialData
  const validCategories = useMemo(() => {
    const categoriesToFilter = configCategories.length > 0 ? configCategories : (serverCategoryIds ?? []);
    
    // Type guard: isValidCategory ensures type safety, no assertion needed
    return categoriesToFilter.filter((cat): cat is content_category => {
      if (!isValidCategory(cat)) {
        return false;
      }
      const data = initialData[cat];
      return Array.isArray(data) && data.length > 0;
    });
  }, [configCategories, serverCategoryIds, initialData]);

  // Update featured categories when validCategories changes
  useEffect(() => {
    setFeaturedCategories(validCategories);
  }, [validCategories]);

  // Search is now handled by SearchProvider + useSearch (unified search system)

  return (
    <>
      {/* Category Stats Section removed - now in hero section directly below search bar */}

      {/* Main Content Section */}
      <section className="container mx-auto px-4 pb-4">
        {/* Search Results Section - Show at top when there's an active search query */}
        {query.trim().length > 0 && (
          <div className="mb-8">
            <Suspense fallback={<div className="text-muted-foreground p-8 text-center">Loading search results...</div>}>
              <SearchResults
                showCategory
                showActions
                onAuthRequired={() => {
                  openAuthModal({
                    valueProposition: 'Sign in to save bookmarks',
                    redirectTo: pathname ?? undefined,
                  });
                }}
              />
            </Suspense>
          </div>
        )}

        {/* Featured Content Sections - Always visible (maintains context) */}
        <LazyFeaturedSections
          categories={categoriesForSections}
          categoryConfigs={categoryConfigs}
          featuredJobs={featuredJobs}
          featuredCategories={featuredCategories}
          bookmarkStatusMap={bookmarkStatusMap}
          {...(weekStart ? { weekStart } : {})}
        />

        {/* All Content Section - Scroll-triggered loading (only fetches when section enters viewport) */}
        <LazyAllContentSection
          {...(weekStart ? { weekStart } : {})}
        />
      </section>
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders when initialData prop hasn't changed
const HomePageClientContentMemo = memo(HomePageClientContent);

/**
 * HomePageClient - Content component (SearchProvider now at page level)
 * 
 * NOTE: SearchProvider is now provided at page level via HomepageSearchProvider
 * This allows hero section to also access SearchProvider context.
 */
function HomePageClientComponent(props: HomePageClientProps) {
  // SearchProvider is now at page level, so we just render content
  return <HomePageClientContentMemo {...props} />;
}

const HomePageClient = memo(HomePageClientComponent);

export { HomePageClient };
