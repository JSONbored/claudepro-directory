'use client';

/**
 * Unified Sidebar - Configuration-driven with inline SidebarCard usage
 *
 * CONSOLIDATION: Uses SidebarCard directly with inline configuration
 * - TrendingGuidesCard → Inline SidebarCard with trending logic
 * - RecentGuidesCard → Inline SidebarCard with recent logic
 * - CategoryNavigationCard → Modular component (keeps router logic)
 *
 * Performance: Optimal tree-shaking, minimal client bundle
 * Pattern: Configuration-driven architecture over wrapper components
 *
 * @see components/shared/sidebar-card.tsx - Base sidebar card component
 */

import Link from 'next/link';
import { memo, useEffect, useState } from 'react';
import { CategoryNavigationCard } from '@/src/components/content/unified-detail-page/sidebar/category-navigation-card';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { Button } from '@/src/components/primitives/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/card';
import { Input } from '@/src/components/primitives/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/primitives/tooltip';
import { ROUTES } from '@/src/lib/constants/routes';
import {
  BookOpen,
  Clock,
  FileText,
  Filter,
  Layers,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from '@/src/lib/icons';
import type { RelatedGuide } from '@/src/lib/schemas/app.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { shallowEqual, slugToTitle } from '@/src/lib/utils';

// TypeScript types (replaces Zod schemas for bundle size optimization)
interface ContentData {
  title?: string;
  description?: string;
  keywords?: string[];
  dateUpdated?: string;
  category?: string;
  content?: string;
}

interface TrendingGuide {
  title: string;
  slug: string;
  views: string;
}

interface RecentGuide {
  title: string;
  slug: string;
  date: string;
}

// Define UnifiedSidebarProps locally
interface UnifiedSidebarProps {
  mode?: 'category' | 'unified' | 'content';
  contentData?: ContentData;
  relatedGuides?: RelatedGuide[];
  currentCategory?: string;
}

const categoryInfo = {
  'use-cases': {
    label: 'Use Cases',
    icon: Zap,
    description: 'Practical guides for specific Claude AI use cases',
    color: 'hover:text-blue-500 hover:bg-blue-500/10',
    activeColor: 'text-blue-500 bg-blue-500/10',
  },
  tutorials: {
    label: 'Tutorials',
    icon: BookOpen,
    description: 'Step-by-step tutorials for Claude features',
    color: 'hover:text-green-500 hover:bg-green-500/10',
    activeColor: 'text-green-500 bg-green-500/10',
  },
  collections: {
    label: 'Collections',
    icon: Layers,
    description: 'Curated collections of tools and agents',
    color: 'hover:text-purple-500 hover:bg-purple-500/10',
    activeColor: 'text-purple-500 bg-purple-500/10',
  },
  categories: {
    label: 'Category Guides',
    icon: FileText,
    description: 'Comprehensive guides by category',
    color: 'hover:text-orange-500 hover:bg-orange-500/10',
    activeColor: 'text-orange-500 bg-orange-500/10',
  },
  workflows: {
    label: 'Workflows',
    icon: Workflow,
    description: 'Complete workflow guides and strategies',
    color: 'hover:text-pink-500 hover:bg-pink-500/10',
    activeColor: 'text-pink-500 bg-pink-500/10',
  },
};

function UnifiedSidebarComponent({
  mode = 'category',
  contentData,
  relatedGuides = [],
  currentCategory: explicitCategory,
}: UnifiedSidebarProps) {
  // Use TypeScript types (no runtime validation needed for props)
  const validatedContentData = contentData;
  const validatedRelatedGuides = relatedGuides || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [trendingGuides, setTrendingGuides] = useState<TrendingGuide[]>([]);
  const [recentGuides, setRecentGuides] = useState<RecentGuide[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);

  // Static, deterministic ID - production-safe for SSR
  const searchInputId = 'unified-sidebar-guides-search';

  // Fetch trending guides data - only run once on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchTrendingData() {
      setIsLoadingTrending(true);
      try {
        // Fetch trending guides from API route (client-safe database query)
        const response = await fetch('/api/guides/trending?category=guides&limit=5');

        if (!response.ok) return; // Silent fail for optional enhancement
        if (!isMounted) return;

        const data = await response.json();

        // Transform API response to match expected format
        const trendingData: TrendingGuide[] = (data.data || []).map(
          (item: { slug: string; title: string; views: number }) => ({
            title: item.title || `Guide: ${slugToTitle(item.slug)}`,
            slug: `/guides/${item.slug}`,
            views: `${item.views?.toLocaleString() || 0} views`,
          })
        );

        if (isMounted) {
          setTrendingGuides(trendingData);
        }
      } catch {
        // Client-side error silently handled - no logging to prevent browser console exposure
      } finally {
        if (isMounted) {
          setIsLoadingTrending(false);
        }
      }
    }

    fetchTrendingData().catch(() => {
      // Silent fail - trending data is optional enhancement
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize recent guides once on mount
  useEffect(() => {
    const recentData: RecentGuide[] = [
      {
        title: 'Getting Started with Claude',
        slug: '/guides/use-cases/getting-started',
        date: new Date().toLocaleDateString(),
      },
      {
        title: 'Advanced Automation',
        slug: '/guides/workflows/automation',
        date: new Date(Date.now() - 86400000).toLocaleDateString(),
      },
      {
        title: 'Development Tips',
        slug: '/guides/tutorials/development',
        date: new Date(Date.now() - 172800000).toLocaleDateString(),
      },
    ];

    setRecentGuides(recentData);
  }, []);

  // Determine active category from explicit prop, URL, or contentData
  const currentCategory =
    explicitCategory ||
    validatedContentData?.category ||
    (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '');

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={'sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto'}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent',
        }}
      >
        <div className={'space-y-3 pr-2 pb-4'}>
          {/* Search & Category Navigation - Available on ALL guide pages */}
          <Card className="border-muted/40 shadow-sm">
            <CardContent className="p-3">
              {/* Search Bar */}
              <div className="relative">
                <Search
                  className={
                    'absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground'
                  }
                />
                <Input
                  id={searchInputId}
                  name="guidesSearch"
                  placeholder="Search guides..."
                  className={
                    'h-8 pl-8 pr-8 text-xs bg-muted/30 border-muted/50 focus:bg-background transition-colors'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className={'absolute right-0 top-0 h-8 w-8 hover:bg-transparent'}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Filter
                        className={`h-3.5 w-3.5 transition-colors ${showFilters ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Filter by category
                    </TooltipContent>
                  </Tooltip>
                </Button>
              </div>

              {/* Category Navigation - Using extracted CategoryNavigationCard */}
              <div className="mt-2">
                <CategoryNavigationCard
                  currentCategory={currentCategory}
                  categories={categoryInfo}
                  basePath="/guides"
                />
              </div>

              {/* Active Filters (if any) */}
              {showFilters && searchQuery && (
                <div className={'mt-2 flex flex-wrap gap-1'}>
                  <UnifiedBadge variant="base" style="secondary" className={'text-xs h-5'}>
                    {searchQuery}
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:text-destructive"
                      aria-label="Clear search query"
                    >
                      ×
                    </button>
                  </UnifiedBadge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trending Section */}
          {(trendingGuides.length > 0 || isLoadingTrending) && (
            <Card className="border-muted/40 shadow-sm">
              <CardHeader className={'pb-2 pt-3 px-3'}>
                <CardTitle className={'text-xs font-medium flex items-center gap-1.5'}>
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span>Trending Now</span>
                </CardTitle>
              </CardHeader>
              <CardContent className={'pb-3 px-3'}>
                <div className="space-y-1.5">
                  {isLoadingTrending ? (
                    <div className={'text-xs text-muted-foreground'}>
                      Loading trending guides...
                    </div>
                  ) : (
                    trendingGuides.map((guide, index) => (
                      <Link
                        key={guide.slug}
                        href={guide.slug}
                        className={
                          'group flex items-center justify-between text-xs hover:bg-muted/50 rounded px-1.5 py-1 transition-colors'
                        }
                      >
                        <span
                          className={
                            'text-muted-foreground group-hover:text-foreground truncate flex-1'
                          }
                        >
                          <span className="text-muted-foreground/60 mr-1.5">{index + 1}.</span>
                          {guide.title}
                        </span>
                        <UnifiedBadge
                          variant="base"
                          style="secondary"
                          className="text-2xs h-4 px-1 bg-muted/50"
                        >
                          {guide.views}
                        </UnifiedBadge>
                      </Link>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content-specific sections */}
          {mode === 'content' && validatedContentData && (
            <>
              {/* Table of Contents */}
              {validatedContentData.content &&
                (() => {
                  const headings = validatedContentData.content.match(/^##\s+(.+)$/gm);
                  if (!headings || headings.length === 0) return null;

                  return (
                    <Card className="border-muted/40 shadow-sm">
                      <CardHeader className={'pb-2 pt-3 px-3'}>
                        <CardTitle className={'text-xs font-medium text-muted-foreground'}>
                          On this page
                        </CardTitle>
                      </CardHeader>
                      <CardContent className={'pb-3 px-3'}>
                        <nav className="space-y-0.5">
                          {headings.slice(0, 5).map((heading) => {
                            const title = heading.replace('## ', '');
                            const id = title.toLowerCase().replace(/\s+/g, '-');
                            return (
                              <a
                                key={id}
                                href={`#${id}`}
                                className={
                                  'block text-3xs text-muted-foreground hover:text-primary transition-colors py-0.5 pl-3 border-l-2 border-transparent hover:border-primary/50 truncate'
                                }
                              >
                                {title}
                              </a>
                            );
                          })}
                          {headings.length > 5 && (
                            <span className="text-2xs text-muted-foreground/60 pl-3 italic">
                              +{headings.length - 5} more sections
                            </span>
                          )}
                        </nav>
                      </CardContent>
                    </Card>
                  );
                })()}

              {/* Related Guides - Only on content pages */}
              {validatedRelatedGuides && validatedRelatedGuides.length > 0 && (
                <Card className="border-muted/40 shadow-sm">
                  <CardHeader className={'pb-2 pt-3 px-3'}>
                    <CardTitle className={'text-xs font-medium flex items-center gap-1.5'}>
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                      <span>Related Guides</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={'pb-3 px-3'}>
                    <div className="space-y-1">
                      {validatedRelatedGuides.slice(0, 3).map((guide) => (
                        <Link key={guide.slug} href={guide.slug} className="block group">
                          <div
                            className={
                              'text-3xs text-muted-foreground group-hover:text-primary transition-colors py-0.5 truncate'
                            }
                          >
                            {guide.title}
                          </div>
                        </Link>
                      ))}
                      {validatedRelatedGuides.length > 3 && (
                        <Link
                          href={ROUTES.GUIDES}
                          className={
                            'text-2xs text-primary hover:underline inline-flex items-center gap-0.5 mt-1'
                          }
                        >
                          View all ({validatedRelatedGuides.length})
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Recent Section */}
          {recentGuides.length > 0 && (
            <Card className="border-muted/40 shadow-sm">
              <CardHeader className={'pb-2 pt-3 px-3'}>
                <CardTitle className={'text-xs font-medium flex items-center gap-1.5'}>
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Recent Guides</span>
                </CardTitle>
              </CardHeader>
              <CardContent className={'pb-3 px-3'}>
                <div className="space-y-1.5">
                  {recentGuides.map((guide) => (
                    <Link key={guide.slug} href={guide.slug} className="group">
                      <div
                        className={
                          'text-3xs text-muted-foreground group-hover:text-primary transition-colors py-0.5'
                        }
                      >
                        <div className="truncate">{guide.title}</div>
                        <div className="text-2xs text-muted-foreground/60">{guide.date}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Getting Started - Show when no trending/recent data */}
          {trendingGuides.length === 0 && recentGuides.length === 0 && (
            <Card className="border-muted/40 shadow-sm">
              <CardHeader className={'pb-2 pt-3 px-3'}>
                <CardTitle className={'text-xs font-medium flex items-center gap-1.5'}>
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                  <span>Getting Started</span>
                </CardTitle>
              </CardHeader>
              <CardContent className={'pb-3 px-3'}>
                <div className={'text-3xs text-muted-foreground space-y-1.5'}>
                  <p>New guides are being added regularly.</p>
                  <p>Check back soon for trending content and recent updates!</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Future Sponsored Placement */}
          {/* This section is reserved for future sponsored content */}
          <Card className="border-dashed border-muted/30 bg-muted/5">
            <CardContent className="p-3">
              <div className="text-2xs text-muted-foreground/50 text-center">
                {/* Reserved for sponsored content */}
                <div className={'flex items-center justify-center gap-1.5'}>
                  <Users className="h-3 w-3" />
                  <span>Community Resources</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className={'px-2 pt-1'}>
            <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} text-2xs`}>
              <Link
                href={ROUTES.GUIDES}
                className={'text-muted-foreground hover:text-primary transition-colors'}
              >
                ← All Guides
              </Link>
              <Link
                href={ROUTES.HOME}
                className={'text-muted-foreground hover:text-primary transition-colors'}
              >
                Browse Directory →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Memoize the component to prevent unnecessary re-renders when props haven't changed
// SHA-2090: Optimized with shallowEqual - 50-80% faster than JSON.stringify
export const UnifiedSidebar = memo(UnifiedSidebarComponent, (prevProps, nextProps) => {
  return (
    prevProps.mode === nextProps.mode &&
    prevProps.currentCategory === nextProps.currentCategory &&
    shallowEqual(prevProps.contentData, nextProps.contentData) &&
    shallowEqual(prevProps.relatedGuides, nextProps.relatedGuides)
  );
});
