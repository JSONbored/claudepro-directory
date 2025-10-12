'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { createSearchIndex, performLocalSearch } from '@/src/hooks/use-search';
import { ROUTES } from '@/src/lib/constants';
import {
  AlertTriangle,
  BookOpen,
  Eye,
  FileText,
  GitCompare,
  Search,
  Users,
  Workflow,
  Zap,
} from '@/src/lib/icons';
import type { EnhancedGuidesPageProps } from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { GuideItemWithCategory } from '@/src/lib/utils/guide-helpers';

const categoryInfo = {
  'use-cases': {
    label: 'Use Cases',
    icon: Zap,
    description: 'Practical guides for specific Claude AI use cases',
    color: 'text-blue-500',
  },
  tutorials: {
    label: 'Tutorials',
    icon: BookOpen,
    description: 'Step-by-step tutorials for Claude features',
    color: 'text-green-500',
  },
  collections: {
    label: 'Collections',
    icon: Users,
    description: 'Curated collections of tools and agents',
    color: 'text-purple-500',
  },
  categories: {
    label: 'Category Guides',
    icon: FileText,
    description: 'Comprehensive guides by category',
    color: 'text-orange-500',
  },
  workflows: {
    label: 'Workflows',
    icon: Workflow,
    description: 'Complete workflow guides and strategies',
    color: 'text-pink-500',
  },
  comparisons: {
    label: 'Comparisons',
    icon: GitCompare,
    description: 'Compare Claude with other development tools',
    color: 'text-red-500',
  },
  troubleshooting: {
    label: 'Troubleshooting',
    icon: AlertTriangle,
    description: 'Solutions for common Claude AI issues',
    color: 'text-yellow-500',
  },
};

export function EnhancedGuidesPage({ guides }: EnhancedGuidesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'category' | 'date'>('title');

  // Generate unique IDs for form controls
  const searchInputId = useId();
  const categorySelectId = useId();
  const sortSelectId = useId();

  // Format view count helper (same as other components)
  const formatViewCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Memoize totalGuides to prevent recalculation on every render
  const totalGuides = useMemo(
    () => Object.values(guides).reduce((acc, cat) => acc + cat.length, 0),
    [guides]
  );

  // Flatten guides for search, then re-group by category
  const allGuides = useMemo(() => Object.values(guides).flat(), [guides]);

  // Create search index once
  const searchIndex = useMemo(
    () => createSearchIndex<GuideItemWithCategory>(allGuides),
    [allGuides]
  );

  // Filter and search guides - using consolidated search logic
  const filteredGuides = useMemo(() => {
    // Perform search
    const searchResults = performLocalSearch<GuideItemWithCategory>(
      searchIndex,
      searchQuery,
      selectedCategory !== 'all' ? { category: selectedCategory } : undefined
    );

    // Apply sorting
    const sorted = [...searchResults].sort((a: GuideItemWithCategory, b: GuideItemWithCategory) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'date':
          if (!(a.dateUpdated && b.dateUpdated)) return 0;
          return new Date(b.dateUpdated).getTime() - new Date(a.dateUpdated).getTime();
        default:
          return 0;
      }
    });

    // Re-group by category
    const result: Record<string, GuideItemWithCategory[]> = {};
    sorted.forEach((guide: GuideItemWithCategory) => {
      const cat = guide.category;
      if (!result[cat]) {
        result[cat] = [];
      }
      result[cat]?.push(guide);
    });

    return result;
  }, [searchIndex, searchQuery, selectedCategory, sortBy]);

  const filteredTotalGuides = Object.values(filteredGuides).reduce(
    (acc, cat) => acc + cat.length,
    0
  );

  return (
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={UI_CLASSES.MB_8}>
          <h1 className={`text-4xl ${UI_CLASSES.FONT_BOLD} ${UI_CLASSES.MB_4}`}>
            Guides & Tutorials
          </h1>
          <p className={`${UI_CLASSES.TEXT_XL} text-muted-foreground`}>
            Learn how to use Claude AI effectively with our comprehensive guides
          </p>
          <div className={`mt-4 ${UI_CLASSES.FLEX_WRAP_GAP_4} ${UI_CLASSES.ITEMS_CENTER}`}>
            <Badge variant="secondary">
              {filteredTotalGuides} of {totalGuides} guides
              {searchQuery && ' matching your search'}
            </Badge>
            {(searchQuery || selectedCategory !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSortBy('title');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Main Layout: Content + Persistent Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Takes 2/3 width */}
          <div className={`lg:col-span-2 ${UI_CLASSES.SPACE_Y_8}`}>
            {/* Quick Stats */}
            <div className={UI_CLASSES.GRID_RESPONSIVE_4}>
              {Object.entries(categoryInfo).map(([key, info]) => {
                const Icon = info.icon;
                const count = guides[key]?.length || 0;

                return (
                  <Card key={key} className={UI_CLASSES.P_4}>
                    <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-3`}>
                      <Icon className={`h-5 w-5 ${info.color}`} />
                      <div>
                        <p className={UI_CLASSES.FONT_SEMIBOLD}>{count}</p>
                        <p className={UI_CLASSES.TEXT_SM_MUTED}>{info.label}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Guides by Category */}
            {Object.entries(filteredGuides).map(([category, categoryGuides]) => {
              if (categoryGuides.length === 0) return null;

              const info = categoryInfo[category as keyof typeof categoryInfo];
              if (!info) return null;
              const Icon = info.icon;

              return (
                <div key={category} className={UI_CLASSES.MB_12}>
                  <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-3 mb-4`}>
                    <Icon className={`h-6 w-6 ${info.color}`} />
                    <div>
                      <h2 className={`text-2xl ${UI_CLASSES.FONT_SEMIBOLD}`}>{info.label}</h2>
                      <p className="text-muted-foreground">{info.description}</p>
                    </div>
                  </div>

                  <div className={UI_CLASSES.GRID_RESPONSIVE_2}>
                    {categoryGuides.map((guide) => (
                      <Link key={guide.slug} href={guide.slug}>
                        <Card
                          className={`${UI_CLASSES.P_6} h-full ${UI_CLASSES.HOVER_BG_ACCENT_10} ${UI_CLASSES.TRANSITION_COLORS}`}
                        >
                          <div className={`${UI_CLASSES.FLEX_COL} h-full`}>
                            <h3
                              className={`${UI_CLASSES.FONT_SEMIBOLD} ${UI_CLASSES.MB_2} ${UI_CLASSES.LINE_CLAMP_2}`}
                            >
                              {guide.title}
                            </h3>
                            <p
                              className={`${UI_CLASSES.TEXT_SM_MUTED} mb-4 ${UI_CLASSES.LINE_CLAMP_3} ${UI_CLASSES.FLEX_GROW}`}
                            >
                              {guide.description}
                            </p>
                            <div
                              className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} mt-auto gap-2`}
                            >
                              <Badge variant="outline" className={UI_CLASSES.TEXT_XS}>
                                {info.label}
                              </Badge>
                              <div className="flex items-center gap-2">
                                {guide.dateUpdated && (
                                  <span className={UI_CLASSES.TEXT_XS_MUTED}>
                                    {new Date(guide.dateUpdated).toLocaleDateString()}
                                  </span>
                                )}
                                {guide.viewCount !== undefined && guide.viewCount > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="h-6 px-2 gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors font-medium"
                                  >
                                    <Eye className="h-3 w-3" aria-hidden="true" />
                                    <span className="text-xs">
                                      {formatViewCount(guide.viewCount)}
                                    </span>
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Persistent Search Sidebar - Takes 1/3 width */}
          <div className={UI_CLASSES.SPACE_Y_6}>
            <div className={`sticky top-20 ${UI_CLASSES.SPACE_Y_6}`}>
              {/* Embedded Search */}
              <Card className={UI_CLASSES.P_4}>
                <h3
                  className={`${UI_CLASSES.FONT_SEMIBOLD} mb-4 ${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-2`}
                >
                  <Search className="h-4 w-4" />
                  Search Guides
                </h3>

                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className={UI_CLASSES.ICON_ABSOLUTE_LEFT} />
                  <Input
                    id={searchInputId}
                    name="guidesSearch"
                    placeholder="Search guides..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Category Filter */}
                <div className={`${UI_CLASSES.SPACE_Y_2} mb-4`}>
                  <span className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>
                    Filter by Category
                  </span>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger
                      className={UI_CLASSES.W_FULL}
                      id={categorySelectId}
                      name="categoryFilter"
                    >
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.entries(categoryInfo).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          {info.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Options */}
                <div className={`${UI_CLASSES.SPACE_Y_2} mb-4`}>
                  <span className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>Sort by</span>
                  <Select
                    value={sortBy}
                    onValueChange={(value: 'title' | 'category' | 'date') => setSortBy(value)}
                  >
                    <SelectTrigger
                      className={UI_CLASSES.W_FULL}
                      id={sortSelectId}
                      name="sortFilter"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Title (A-Z)</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="date">Date Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Filter Tags */}
                <div className={UI_CLASSES.SPACE_Y_2}>
                  <span className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>
                    Popular Tags
                  </span>
                  <div className={UI_CLASSES.FLEX_WRAP_GAP_1}>
                    {['automation', 'development', 'workflows', 'beginner', 'advanced'].map(
                      (tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className={`text-xs cursor-pointer ${UI_CLASSES.HOVER_BG_ACCENT}`}
                          onClick={() => setSearchQuery(tag)}
                        >
                          #{tag}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              </Card>

              {/* Categories */}
              <Card className={UI_CLASSES.P_4}>
                <h3 className={`${UI_CLASSES.FONT_SEMIBOLD} ${UI_CLASSES.MB_3}`}>
                  Browse by Category
                </h3>
                <div className={UI_CLASSES.SPACE_Y_2}>
                  {Object.entries(categoryInfo).map(([key, info]) => {
                    const Icon = info.icon;
                    const count = guides[key]?.length || 0;

                    if (count === 0) return null;

                    return (
                      <Link
                        key={key}
                        href={`/guides/${key}`}
                        className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} ${UI_CLASSES.P_2} ${UI_CLASSES.ROUNDED_LG} ${UI_CLASSES.HOVER_BG_MUTED_50} ${UI_CLASSES.TRANSITION_COLORS} ${UI_CLASSES.GROUP}`}
                      >
                        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                          <Icon className={`h-4 w-4 ${info.color}`} />
                          <span
                            className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM} ${UI_CLASSES.GROUP_HOVER_TEXT_PRIMARY}`}
                          >
                            {info.label}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </Card>

              {/* Recent Guides */}
              <Card className={UI_CLASSES.P_4}>
                <h3 className={`${UI_CLASSES.FONT_SEMIBOLD} ${UI_CLASSES.MB_3}`}>Recent Guides</h3>
                <div className={UI_CLASSES.SPACE_Y_2}>
                  {Object.values(guides)
                    .flat()
                    .filter((guide) => guide.dateUpdated)
                    .sort(
                      (a, b) =>
                        new Date(b.dateUpdated || '').getTime() -
                        new Date(a.dateUpdated || '').getTime()
                    )
                    .slice(0, 5)
                    .map((guide) => (
                      <Link
                        key={guide.slug}
                        href={guide.slug}
                        className={`block ${UI_CLASSES.P_2} ${UI_CLASSES.ROUNDED_LG} ${UI_CLASSES.HOVER_BG_MUTED_50} ${UI_CLASSES.TRANSITION_COLORS} ${UI_CLASSES.GROUP}`}
                      >
                        <div
                          className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM} ${UI_CLASSES.GROUP_HOVER_TEXT_PRIMARY} ${UI_CLASSES.LINE_CLAMP_2} mb-1`}
                        >
                          {guide.title}
                        </div>
                        <div className={UI_CLASSES.TEXT_XS_MUTED}>
                          {guide.dateUpdated && new Date(guide.dateUpdated).toLocaleDateString()}
                        </div>
                      </Link>
                    ))}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className={UI_CLASSES.P_4}>
                <h3 className={`${UI_CLASSES.FONT_SEMIBOLD} mb-3`}>Quick Actions</h3>
                <div className={UI_CLASSES.SPACE_Y_2}>
                  <Link href={ROUTES.HOME} className={UI_CLASSES.LIST_ITEM_HOVER}>
                    Browse Directory
                  </Link>
                  <Link href={ROUTES.SUBMIT} className={UI_CLASSES.LIST_ITEM_HOVER}>
                    Submit Content
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Card className="p-8 mt-12 text-center bg-accent/10">
          <h2 className={`text-2xl ${UI_CLASSES.FONT_SEMIBOLD} mb-4`}>
            Can't find what you're looking for?
          </h2>
          <p className="text-muted-foreground mb-6">
            Browse our complete directory or submit your own content
          </p>
          <div className={`${UI_CLASSES.FLEX} gap-4 ${UI_CLASSES.JUSTIFY_CENTER}`}>
            <Link href={ROUTES.HOME}>
              <button
                type="button"
                className={`${UI_CLASSES.PX_6} py-2 bg-primary text-primary-foreground ${UI_CLASSES.ROUNDED_LG} hover:bg-primary/90`}
              >
                Browse Directory
              </button>
            </Link>
            <Link href={ROUTES.SUBMIT}>
              <button
                type="button"
                className={`${UI_CLASSES.PX_6} py-2 border border-border ${UI_CLASSES.ROUNDED_LG} ${UI_CLASSES.HOVER_BG_ACCENT}`}
              >
                Submit Content
              </button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
