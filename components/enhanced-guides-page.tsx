'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createSearchIndex, performLocalSearch } from '@/hooks/use-search';
import type { GuideItemWithCategory } from '@/lib/components/guide-page-factory';
import {
  AlertTriangle,
  BookOpen,
  FileText,
  GitCompare,
  Search,
  Users,
  Workflow,
  Zap,
} from '@/lib/icons';
import type { EnhancedGuidesPageProps } from '@/lib/schemas/component.schema';

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

  const totalGuides = Object.values(guides).reduce((acc, cat) => acc + cat.length, 0);

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Guides & Tutorials</h1>
          <p className="text-xl text-muted-foreground">
            Learn how to use Claude AI effectively with our comprehensive guides
          </p>
          <div className="mt-4 flex flex-wrap gap-4 items-center">
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
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(categoryInfo).map(([key, info]) => {
                const Icon = info.icon;
                const count = guides[key]?.length || 0;

                return (
                  <Card key={key} className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${info.color}`} />
                      <div>
                        <p className="font-semibold">{count}</p>
                        <p className="text-sm text-muted-foreground">{info.label}</p>
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
                <div key={category} className="mb-12">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className={`h-6 w-6 ${info.color}`} />
                    <div>
                      <h2 className="text-2xl font-semibold">{info.label}</h2>
                      <p className="text-muted-foreground">{info.description}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    {categoryGuides.map((guide) => (
                      <Link key={guide.slug} href={guide.slug}>
                        <Card className="p-6 h-full hover:bg-accent/10 transition-colors">
                          <div className="flex flex-col h-full">
                            <h3 className="font-semibold mb-2 line-clamp-2">{guide.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">
                              {guide.description}
                            </p>
                            <div className="flex items-center justify-between mt-auto">
                              <Badge variant="outline" className="text-xs">
                                {info.label}
                              </Badge>
                              {guide.dateUpdated && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(guide.dateUpdated).toLocaleDateString()}
                                </span>
                              )}
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
          <div className="space-y-6">
            <div className="sticky top-20 space-y-6">
              {/* Embedded Search */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search Guides
                </h3>

                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                <div className="space-y-2 mb-4">
                  <span className="text-sm font-medium">Filter by Category</span>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full" id={categorySelectId} name="categoryFilter">
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
                <div className="space-y-2 mb-4">
                  <span className="text-sm font-medium">Sort by</span>
                  <Select
                    value={sortBy}
                    onValueChange={(value: 'title' | 'category' | 'date') => setSortBy(value)}
                  >
                    <SelectTrigger className="w-full" id={sortSelectId} name="sortFilter">
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
                <div className="space-y-2">
                  <span className="text-sm font-medium">Popular Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {['automation', 'development', 'workflows', 'beginner', 'advanced'].map(
                      (tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-accent"
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
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Browse by Category</h3>
                <div className="space-y-2">
                  {Object.entries(categoryInfo).map(([key, info]) => {
                    const Icon = info.icon;
                    const count = guides[key]?.length || 0;

                    if (count === 0) return null;

                    return (
                      <Link
                        key={key}
                        href={`/guides/${key}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${info.color}`} />
                          <span className="text-sm font-medium group-hover:text-primary">
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
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Recent Guides</h3>
                <div className="space-y-2">
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
                        className="block p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="text-sm font-medium group-hover:text-primary line-clamp-2 mb-1">
                          {guide.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {guide.dateUpdated && new Date(guide.dateUpdated).toLocaleDateString()}
                        </div>
                      </Link>
                    ))}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/"
                    className="block w-full text-left p-2 text-sm rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    Browse Directory
                  </Link>
                  <Link
                    href="/submit"
                    className="block w-full text-left p-2 text-sm rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    Submit Content
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Card className="p-8 mt-12 text-center bg-accent/10">
          <h2 className="text-2xl font-semibold mb-4">Can't find what you're looking for?</h2>
          <p className="text-muted-foreground mb-6">
            Browse our complete directory or submit your own content
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <button
                type="button"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Browse Directory
              </button>
            </Link>
            <Link href="/submit">
              <button
                type="button"
                className="px-6 py-2 border border-border rounded-lg hover:bg-accent"
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
