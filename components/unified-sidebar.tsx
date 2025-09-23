'use client';

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
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// Dynamic imports for server-side functions
import { statsRedis } from '@/lib/redis';

interface RelatedGuide {
  title: string;
  slug: string;
  category: string;
}

interface UnifiedSidebarProps {
  // For content pages
  mode?: 'category' | 'content';
  contentData?: {
    title?: string;
    description?: string;
    keywords?: string[];
    dateUpdated?: string;
    category?: string;
    content?: string;
  };
  relatedGuides?: RelatedGuide[];
  currentCategory?: string; // Allow explicit category for category pages
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

export function UnifiedSidebar({
  mode = 'category',
  contentData,
  relatedGuides = [],
  currentCategory: explicitCategory,
}: UnifiedSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [trendingGuides, setTrendingGuides] = useState<TrendingGuide[]>([]);
  const [recentGuides, setRecentGuides] = useState<RecentGuide[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);

  // Fetch trending guides data
  useEffect(() => {
    async function fetchTrendingData() {
      if (!statsRedis.isEnabled()) return;

      setIsLoadingTrending(true);
      try {
        // Get trending guide slugs from Redis
        const trendingSlugs = await statsRedis.getTrending('guides', 5);

        // For now, create mock trending data based on Redis trending slugs
        // TODO: Implement proper server-side API for guide metadata
        const trendingData: TrendingGuide[] = trendingSlugs.map((slug, index) => ({
          title: `Guide: ${slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`,
          slug: `/guides/${slug}`,
          views: `${Math.max(1, 50 - index * 5)} views`,
        }));

        setTrendingGuides(trendingData);

        // Mock recent guides data
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
      } catch (error) {
        console.error('Failed to fetch trending guides:', error);
      } finally {
        setIsLoadingTrending(false);
      }
    }

    fetchTrendingData();
  }, []);

  // Determine active category from explicit prop, URL, or contentData
  const currentCategory =
    explicitCategory ||
    contentData?.category ||
    (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '');

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent',
        }}
      >
        <div className="space-y-3 pr-2 pb-4">
          {/* Search & Category Navigation - Available on ALL guide pages */}
          <Card className="border-muted/40 shadow-sm">
            <CardContent className="p-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search guides..."
                  className="h-8 pl-8 pr-8 text-xs bg-muted/30 border-muted/50 focus:bg-background transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-8 w-8 hover:bg-transparent"
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

              {/* Category Icons - Available on ALL pages */}
              <div className="flex items-center justify-between mt-3 px-1">
                {Object.entries(categoryInfo).map(([key, info]) => {
                  const Icon = info.icon;
                  const isActive = currentCategory === key;

                  return (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/guides/${key}`}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            isActive ? info.activeColor : `text-muted-foreground ${info.color}`
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                        <div className="font-semibold">{info.label}</div>
                        <div className="text-muted-foreground mt-0.5">{info.description}</div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {/* Active Filters (if any) */}
              {showFilters && searchQuery && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs h-5">
                    {searchQuery}
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trending/Popular Section - Only show if we have data or are loading */}
          {(trendingGuides.length > 0 || isLoadingTrending) && (
            <Card className="border-muted/40 shadow-sm">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span>Trending Now</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className="space-y-1.5">
                  {isLoadingTrending ? (
                    <div className="text-xs text-muted-foreground">Loading trending guides...</div>
                  ) : (
                    trendingGuides.map((guide, index) => (
                      <Link
                        key={guide.slug}
                        href={guide.slug}
                        className="group flex items-center justify-between text-xs hover:bg-muted/50 rounded px-1.5 py-1 transition-colors"
                      >
                        <span className="text-muted-foreground group-hover:text-foreground truncate flex-1">
                          <span className="text-muted-foreground/60 mr-1.5">{index + 1}.</span>
                          {guide.title}
                        </span>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-muted/50">
                          {guide.views}
                        </Badge>
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
                      <CardHeader className="pb-2 pt-3 px-3">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                          On this page
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-3 px-3">
                        <nav className="space-y-0.5">
                          {headings.slice(0, 5).map((heading) => {
                            const title = heading.replace('## ', '');
                            const id = title.toLowerCase().replace(/\s+/g, '-');
                            return (
                              <a
                                key={id}
                                href={`#${id}`}
                                className="block text-[11px] text-muted-foreground hover:text-primary transition-colors py-0.5 pl-3 border-l-2 border-transparent hover:border-primary/50 truncate"
                              >
                                {title}
                              </a>
                            );
                          })}
                          {headings.length > 5 && (
                            <span className="text-[10px] text-muted-foreground/60 pl-3 italic">
                              +{headings.length - 5} more sections
                            </span>
                          )}
                        </nav>
                      </CardContent>
                    </Card>
                  );
                })()}

              {/* Related Guides - Only on content pages */}
              {relatedGuides && relatedGuides.length > 0 && (
                <Card className="border-muted/40 shadow-sm">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                      <span>Related Guides</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 px-3">
                    <div className="space-y-1">
                      {relatedGuides.slice(0, 3).map((guide) => (
                        <Link key={guide.slug} href={guide.slug} className="block group">
                          <div className="text-[11px] text-muted-foreground group-hover:text-primary transition-colors py-0.5 truncate">
                            {guide.title}
                          </div>
                        </Link>
                      ))}
                      {relatedGuides.length > 3 && (
                        <Link
                          href="/guides"
                          className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 mt-1"
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

          {/* Recent Guides Section - Only show if we have data */}
          {recentGuides.length > 0 && (
            <Card className="border-muted/40 shadow-sm">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Recent Guides</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className="space-y-1.5">
                  {recentGuides.map((guide) => (
                    <Link key={guide.slug} href={guide.slug} className="group block">
                      <div className="text-[11px] text-muted-foreground group-hover:text-primary transition-colors py-0.5">
                        <div className="truncate">{guide.title}</div>
                        <div className="text-[10px] text-muted-foreground/60">{guide.date}</div>
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
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                  <span>Getting Started</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className="text-[11px] text-muted-foreground space-y-1.5">
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
              <div className="text-[10px] text-muted-foreground/50 text-center">
                {/* Reserved for sponsored content */}
                <div className="flex items-center justify-center gap-1.5">
                  <Users className="h-3 w-3" />
                  <span>Community Resources</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="px-2 pt-1">
            <div className="flex items-center justify-between text-[10px]">
              <Link
                href="/guides"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                ← All Guides
              </Link>
              <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                Browse Directory →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
