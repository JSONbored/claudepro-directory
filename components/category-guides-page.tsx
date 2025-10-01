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
  ArrowLeft,
  BookOpen,
  FileText,
  GitCompare,
  Search,
  Users,
  Workflow,
  Zap,
} from '@/lib/icons';
import { UI_CLASSES } from '@/lib/ui-constants';

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

interface CategoryGuidesPageProps {
  category: string;
  guides: GuideItemWithCategory[];
}

export function CategoryGuidesPage({ category, guides }: CategoryGuidesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'date'>('title');

  const searchInputId = useId();
  const sortSelectId = useId();

  const info = categoryInfo[category as keyof typeof categoryInfo];
  const Icon = info?.icon || BookOpen;

  // Create search index
  const searchIndex = useMemo(() => createSearchIndex<GuideItemWithCategory>(guides), [guides]);

  // Filter and search guides
  const filteredGuides = useMemo(() => {
    const searchResults = performLocalSearch<GuideItemWithCategory>(searchIndex, searchQuery);

    return [...searchResults].sort((a: GuideItemWithCategory, b: GuideItemWithCategory) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'date':
          if (!(a.dateUpdated && b.dateUpdated)) return 0;
          return new Date(b.dateUpdated).getTime() - new Date(a.dateUpdated).getTime();
        default:
          return 0;
      }
    });
  }, [searchIndex, searchQuery, sortBy]);

  return (
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className={UI_CLASSES.MB_6}>
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link href="/guides">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Guides
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className={UI_CLASSES.MB_8}>
          <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-3 ${UI_CLASSES.MB_4}`}>
            <Icon className={`h-8 w-8 ${info?.color}`} />
            <h1 className={`text-4xl ${UI_CLASSES.FONT_BOLD}`}>{info?.label || category}</h1>
          </div>
          <p className={`${UI_CLASSES.TEXT_XL} text-muted-foreground`}>
            {info?.description || `Browse all ${category} guides`}
          </p>
          <div className={`mt-4 ${UI_CLASSES.FLEX_WRAP_GAP_4} ${UI_CLASSES.ITEMS_CENTER}`}>
            <Badge variant="secondary">
              {filteredGuides.length} of {guides.length} guides
              {searchQuery && ' matching your search'}
            </Badge>
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSortBy('title');
                }}
              >
                Clear search
              </Button>
            )}
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className={UI_CLASSES.GRID_RESPONSIVE_2}>
              {filteredGuides.map((guide) => (
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
                      {guide.dateUpdated && (
                        <div className="mt-auto">
                          <span className={UI_CLASSES.TEXT_XS_MUTED}>
                            Updated {new Date(guide.dateUpdated).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {filteredGuides.length === 0 && (
              <Card className={`${UI_CLASSES.P_8} text-center`}>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'No guides found matching your search'
                    : 'No guides available in this category yet'}
                </p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className={UI_CLASSES.SPACE_Y_6}>
            <div className={`sticky top-20 ${UI_CLASSES.SPACE_Y_6}`}>
              {/* Search */}
              <Card className={UI_CLASSES.P_4}>
                <h3
                  className={`${UI_CLASSES.FONT_SEMIBOLD} mb-4 ${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-2`}
                >
                  <Search className="h-4 w-4" />
                  Search {info?.label}
                </h3>

                <div className="relative mb-4">
                  <Search className={UI_CLASSES.ICON_ABSOLUTE_LEFT} />
                  <Input
                    id={searchInputId}
                    name="categoryGuidesSearch"
                    placeholder="Search guides..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className={UI_CLASSES.SPACE_Y_2}>
                  <span className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>Sort by</span>
                  <Select
                    value={sortBy}
                    onValueChange={(value: 'title' | 'date') => setSortBy(value)}
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
                      <SelectItem value="date">Date Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              {/* Other Categories */}
              <Card className={UI_CLASSES.P_4}>
                <h3 className={`${UI_CLASSES.FONT_SEMIBOLD} ${UI_CLASSES.MB_3}`}>
                  Other Categories
                </h3>
                <div className={UI_CLASSES.SPACE_Y_2}>
                  {Object.entries(categoryInfo)
                    .filter(([key]) => key !== category)
                    .map(([key, catInfo]) => {
                      const CatIcon = catInfo.icon;
                      return (
                        <Link
                          key={key}
                          href={`/guides/${key}`}
                          className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} ${UI_CLASSES.P_2} ${UI_CLASSES.ROUNDED_LG} ${UI_CLASSES.HOVER_BG_MUTED_50} ${UI_CLASSES.TRANSITION_COLORS} ${UI_CLASSES.GROUP}`}
                        >
                          <CatIcon className={`h-4 w-4 ${catInfo.color}`} />
                          <span
                            className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM} ${UI_CLASSES.GROUP_HOVER_TEXT_PRIMARY}`}
                          >
                            {catInfo.label}
                          </span>
                        </Link>
                      );
                    })}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className={UI_CLASSES.P_4}>
                <h3 className={`${UI_CLASSES.FONT_SEMIBOLD} mb-3`}>Quick Actions</h3>
                <div className={UI_CLASSES.SPACE_Y_2}>
                  <Link href="/guides" className={UI_CLASSES.LIST_ITEM_HOVER}>
                    All Guides
                  </Link>
                  <Link href="/" className={UI_CLASSES.LIST_ITEM_HOVER}>
                    Browse Directory
                  </Link>
                  <Link href="/submit" className={UI_CLASSES.LIST_ITEM_HOVER}>
                    Submit Content
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
