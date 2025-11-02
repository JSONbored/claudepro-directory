'use client';

/**
 * Unified Sidebar - Database-First Architecture
 *
 * OPTIMIZATIONS:
 * - Single RPC call for trending + recent guides (get_sidebar_guides_data)
 * - Removed legacy subcategory navigation (post-migration cleanup)
 * - Replaced non-functional search with command palette trigger
 * - 60%+ LOC reduction through consolidation
 *
 * @see migrations/create_sidebar_guides_data_rpc.sql
 */

import Link from 'next/link';
import { memo, useEffect, useState } from 'react';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { SearchTrigger } from '@/src/components/features/search/search-trigger';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/card';
import { ROUTES } from '@/src/lib/constants/routes';
import { Clock, Sparkles, TrendingUp, Users } from '@/src/lib/icons';
import type { RelatedGuide } from '@/src/lib/schemas/app.schema';
import { createClient } from '@/src/lib/supabase/client';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { shallowEqual, slugToTitle } from '@/src/lib/utils';

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

interface SidebarData {
  trending: Array<{ slug: string; title: string; view_count: number }>;
  recent: Array<{ slug: string; title: string; created_at: string }>;
}

interface UnifiedSidebarProps {
  mode?: 'category' | 'unified' | 'content';
  contentData?: {
    content?: string;
    category?: string;
  };
  relatedGuides?: RelatedGuide[];
}

function UnifiedSidebarComponent({
  mode = 'category',
  contentData,
  relatedGuides = [],
}: UnifiedSidebarProps) {
  const [sidebarData, setSidebarData] = useState<{
    trending: TrendingGuide[];
    recent: RecentGuide[];
  }>({
    trending: [],
    recent: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all sidebar data with single RPC call
  useEffect(() => {
    let isMounted = true;

    async function fetchSidebarData() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_sidebar_guides_data', { p_limit: 5 });

        if (error || !data || !isMounted) return;

        const result = data as unknown as SidebarData;

        const trending: TrendingGuide[] = (result.trending || []).map((item) => ({
          title: item.title || `Guide: ${slugToTitle(item.slug)}`,
          slug: `/guides/${item.slug}`,
          views: `${item.view_count?.toLocaleString() || 0} views`,
        }));

        const recent: RecentGuide[] = (result.recent || []).map((item) => ({
          title: item.title || `Guide: ${slugToTitle(item.slug)}`,
          slug: `/guides/${item.slug}`,
          date: new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        }));

        if (isMounted) {
          setSidebarData({ trending, recent });
        }
      } catch {
        // Silent fail - sidebar data is optional enhancement
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchSidebarData().catch(() => {
      // Silent fail
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Trigger command palette
  const handleSearchClick = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <div
      className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent',
      }}
    >
      <div className="space-y-3 pr-2 pb-4">
        {/* Global Search Trigger */}
        <Card className="border-muted/40 shadow-sm">
          <CardContent className="p-3">
            <SearchTrigger
              onClick={handleSearchClick}
              variant="minimal"
              size="sm"
              showShortcut={true}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Trending Section */}
        {(sidebarData.trending.length > 0 || isLoading) && (
          <Card className="border-muted/40 shadow-sm">
            <CardHeader className="px-3 pt-3 pb-2">
              <CardTitle className="flex items-center gap-1.5 font-medium text-xs">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span>Trending Now</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="space-y-1.5">
                {isLoading ? (
                  <div className="text-muted-foreground text-xs">Loading trending guides...</div>
                ) : (
                  sidebarData.trending.map((guide, index) => (
                    <Link
                      key={guide.slug}
                      href={guide.slug}
                      className="group flex items-center justify-between rounded px-1.5 py-1 text-xs transition-colors hover:bg-muted/50"
                    >
                      <span className="flex-1 truncate text-muted-foreground group-hover:text-foreground">
                        <span className="mr-1.5 text-muted-foreground/60">{index + 1}.</span>
                        {guide.title}
                      </span>
                      <UnifiedBadge
                        variant="base"
                        style="secondary"
                        className="h-4 bg-muted/50 px-1 text-2xs"
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
        {mode === 'content' && contentData && (
          <>
            {/* Table of Contents */}
            {contentData.content &&
              (() => {
                const headings = contentData.content.match(/^##\s+(.+)$/gm);
                if (!headings || headings.length === 0) return null;

                return (
                  <Card className="border-muted/40 shadow-sm">
                    <CardHeader className={'px-3 pt-3 pb-2'}>
                      <CardTitle className={'font-medium text-muted-foreground text-xs'}>
                        On this page
                      </CardTitle>
                    </CardHeader>
                    <CardContent className={'px-3 pb-3'}>
                      <nav className="space-y-0.5">
                        {headings.slice(0, 5).map((heading) => {
                          const title = heading.replace('## ', '');
                          const id = title.toLowerCase().replace(/\s+/g, '-');
                          return (
                            <a
                              key={id}
                              href={`#${id}`}
                              className={
                                'block truncate border-transparent border-l-2 py-0.5 pl-3 text-3xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary'
                              }
                            >
                              {title}
                            </a>
                          );
                        })}
                        {headings.length > 5 && (
                          <span className="pl-3 text-2xs text-muted-foreground/60 italic">
                            +{headings.length - 5} more sections
                          </span>
                        )}
                      </nav>
                    </CardContent>
                  </Card>
                );
              })()}

            {/* Related Guides - Only on content pages */}
            {relatedGuides.length > 0 && (
              <Card className="border-muted/40 shadow-sm">
                <CardHeader className={'px-3 pt-3 pb-2'}>
                  <CardTitle className={'flex items-center gap-1.5 font-medium text-xs'}>
                    <Sparkles className="h-3 w-3 text-yellow-500" />
                    <span>Related Guides</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="space-y-1">
                    {relatedGuides.slice(0, 3).map((guide) => (
                      <Link key={guide.slug} href={guide.slug} className="group block">
                        <div className="truncate py-0.5 text-3xs text-muted-foreground transition-colors group-hover:text-primary">
                          {guide.title}
                        </div>
                      </Link>
                    ))}
                    {relatedGuides.length > 3 && (
                      <Link
                        href={ROUTES.GUIDES}
                        className="mt-1 inline-flex items-center gap-0.5 text-2xs text-primary hover:underline"
                      >
                        View all ({relatedGuides.length})
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Recent Section */}
        {sidebarData.recent.length > 0 && (
          <Card className="border-muted/40 shadow-sm">
            <CardHeader className="px-3 pt-3 pb-2">
              <CardTitle className="flex items-center gap-1.5 font-medium text-xs">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>Recent Guides</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="space-y-1.5">
                {sidebarData.recent.map((guide) => (
                  <Link key={guide.slug} href={guide.slug} className="group">
                    <div className="py-0.5 text-3xs text-muted-foreground transition-colors group-hover:text-primary">
                      <div className="truncate">{guide.title}</div>
                      <div className="text-2xs text-muted-foreground/60">{guide.date}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Getting Started - Show when no data */}
        {!isLoading && sidebarData.trending.length === 0 && sidebarData.recent.length === 0 && (
          <Card className="border-muted/40 shadow-sm">
            <CardHeader className="px-3 pt-3 pb-2">
              <CardTitle className="flex items-center gap-1.5 font-medium text-xs">
                <Sparkles className="h-3 w-3 text-yellow-500" />
                <span>Getting Started</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="space-y-1.5 text-3xs text-muted-foreground">
                <p>New guides are being added regularly.</p>
                <p>Check back soon for trending content and recent updates!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Community Resources (Future) */}
        <Card className="border-muted/30 border-dashed bg-muted/5">
          <CardContent className="p-3">
            <div className="text-center text-2xs text-muted-foreground/50">
              <div className="flex items-center justify-center gap-1.5">
                <Users className="h-3 w-3" />
                <span>Community Resources</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="px-2 pt-1">
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} text-2xs`}>
            <Link
              href={ROUTES.GUIDES}
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              ← All Guides
            </Link>
            <Link
              href={ROUTES.HOME}
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Browse Directory →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const UnifiedSidebar = memo(UnifiedSidebarComponent, (prevProps, nextProps) => {
  return (
    prevProps.mode === nextProps.mode &&
    shallowEqual(prevProps.contentData, nextProps.contentData) &&
    shallowEqual(prevProps.relatedGuides, nextProps.relatedGuides)
  );
});
