'use client';

import { ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useId, useMemo, useState } from 'react';
import { ConfigCard } from '@/components/config-card';
import { InfiniteScrollContainer } from '@/components/infinite-scroll-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type FilterState, UnifiedSearch } from '@/components/unified-search';
import { getIconByName } from '@/lib/icons';
import type { ContentCategory, ContentMetadata } from '@/types/content';

interface ContentListPageProps<T extends ContentMetadata> {
  title: string;
  description: string;
  icon: string;
  items: T[];
  type: ContentCategory;
  searchPlaceholder?: string;
  badges?: Array<{
    icon?: string;
    text: string;
  }>;
}

export function ContentListPage<T extends ContentMetadata>({
  title,
  description,
  icon,
  items,
  type,
  searchPlaceholder = `Search ${title.toLowerCase()}...`,
  badges = [],
}: ContentListPageProps<T>) {
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  const [displayedItems, setDisplayedItems] = useState<T[]>(items.slice(0, 20));
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({ sort: 'trending' });
  const pageSize = 20;

  // Generate unique ID for page title
  const pageTitleId = useId();

  // Filter and search logic
  const handleSearch = useCallback(
    (query: string) => {
      const searchLower = query.toLowerCase();
      const filtered = items.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
          item.category?.toLowerCase().includes(searchLower) ||
          item.author?.toLowerCase().includes(searchLower)
      );
      setFilteredItems(filtered);
      setDisplayedItems(filtered.slice(0, pageSize));
      setCurrentPage(1);
    },
    [items]
  );

  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);

      let processed = [...filteredItems];

      // Apply category filter
      if (newFilters.category) {
        processed = processed.filter((item) => item.category === newFilters.category);
      }

      // Apply author filter
      if (newFilters.author) {
        processed = processed.filter((item) => item.author === newFilters.author);
      }

      // Apply tags filter
      if (newFilters.tags && newFilters.tags.length > 0) {
        processed = processed.filter((item) =>
          newFilters.tags?.some((tag) => item.tags?.includes(tag))
        );
      }

      // Date range filter - most content doesn't have dates, so skip this
      // if (newFilters.dateRange) {
      //   Date filtering would go here if items had date fields
      // }

      // Apply sorting
      switch (newFilters.sort) {
        case 'alphabetical':
          processed.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          break;
        case 'newest':
          // Most items don't have dates, so keep original order
          break;
        default:
          // Keep original order which should be trending
          break;
      }

      setFilteredItems(processed);
      setDisplayedItems(processed.slice(0, pageSize));
      setCurrentPage(1);
    },
    [filteredItems]
  );

  // Load more function for infinite scroll
  const loadMore = useCallback(async () => {
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const nextItems = filteredItems.slice(startIndex, endIndex);

    // Simulate async load with small delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    setDisplayedItems((prev) => [...prev, ...nextItems]);
    setCurrentPage(nextPage);

    return nextItems;
  }, [currentPage, filteredItems]);

  const hasMore = displayedItems.length < filteredItems.length;

  // Extract unique values for filters
  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category))].filter(Boolean) as string[],
    [items]
  );
  const tags = useMemo(
    () => [...new Set(items.flatMap((item) => item.tags || []))].filter(Boolean),
    [items]
  );
  const authors = useMemo(
    () => [...new Set(items.map((item) => item.author))].filter(Boolean) as string[],
    [items]
  );

  // Default badges if none provided
  const displayBadges =
    badges.length > 0
      ? badges
      : [
          { icon: Sparkles, text: `${items.length} ${title} Available` },
          { text: 'Community Driven' },
          { text: 'Production Ready' },
        ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden border-b border-border/50 bg-card/30"
        aria-labelledby="page-title"
      >
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-accent/10 rounded-full" aria-hidden="true">
                {(() => {
                  const IconComponent = getIconByName(icon);
                  return <IconComponent className="h-8 w-8 text-primary" />;
                })()}
              </div>
            </div>

            <h1 id={pageTitleId} className="text-4xl lg:text-6xl font-bold mb-6 text-foreground">
              {title}
            </h1>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{description}</p>

            <ul className="flex flex-wrap justify-center gap-2 mb-8 list-none">
              {displayBadges.map((badge, idx) => (
                <li key={badge.text || `badge-${idx}`}>
                  <Badge variant={idx === 0 ? 'secondary' : 'outline'}>
                    {badge.icon &&
                      (() => {
                        if (typeof badge.icon === 'string') {
                          const BadgeIconComponent = getIconByName(badge.icon);
                          return <BadgeIconComponent className="h-3 w-3 mr-1" aria-hidden="true" />;
                        } else {
                          const BadgeIconComponent = badge.icon;
                          return <BadgeIconComponent className="h-3 w-3 mr-1" aria-hidden="true" />;
                        }
                      })()}
                    {badge.text}
                  </Badge>
                </li>
              ))}
            </ul>

            {/* Submit Button */}
            <Button variant="outline" size="sm" asChild>
              <Link
                href="/submit"
                className="flex items-center gap-2"
                aria-label={`Submit a new ${title.slice(0, -1).toLowerCase()}`}
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                Submit {title.slice(0, -1)}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12" aria-label={`${title} content and search`}>
        <div className="space-y-8">
          {/* Unified Search & Filters */}
          <UnifiedSearch
            placeholder={searchPlaceholder}
            onSearch={handleSearch}
            onFiltersChange={handleFiltersChange}
            filters={filters}
            availableTags={tags}
            availableAuthors={authors}
            availableCategories={categories}
            resultCount={filteredItems.length}
          />

          {/* Infinite Scroll Results */}
          {filteredItems.length > 0 ? (
            <InfiniteScrollContainer
              items={displayedItems}
              renderItem={(item) => <ConfigCard key={item.id} {...item} type={type} />}
              loadMore={loadMore}
              hasMore={hasMore}
              pageSize={20}
              gridClassName="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              emptyMessage={`No ${title.toLowerCase()} found`}
              keyExtractor={(item) => item.id}
            />
          ) : (
            <output className="text-center py-12 block">
              {(() => {
                const IconComponent = getIconByName(icon);
                return (
                  <IconComponent
                    className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50"
                    aria-hidden="true"
                  />
                );
              })()}
              <h2 className="text-lg font-semibold mb-2">No {title.toLowerCase()} found</h2>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or filters.
              </p>
            </output>
          )}
        </div>
      </section>
    </div>
  );
}
