'use client';

import { useCallback, useMemo, useState } from 'react';
import { ConfigCard } from '@/components/config-card';
import { Button } from '@/components/ui/button';
import type { ContentItem } from '@/types/content';

interface ContentListWithLoadMoreProps {
  items: ContentItem[];
  type: 'rules' | 'mcp' | 'agents' | 'commands' | 'hooks';
  initialCount?: number;
  loadMoreCount?: number;
  gridCols?: string;
}

export function ContentListWithLoadMore({
  items,
  type,
  initialCount = 12,
  loadMoreCount = 12,
  gridCols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
}: ContentListWithLoadMoreProps) {
  const [displayCount, setDisplayCount] = useState(initialCount);

  const displayedItems = useMemo(() => {
    return items.slice(0, displayCount);
  }, [items, displayCount]);

  const hasMore = displayCount < items.length;
  const remainingCount = items.length - displayCount;

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + loadMoreCount, items.length));
  }, [loadMoreCount, items.length]);

  const loadAll = useCallback(() => {
    setDisplayCount(items.length);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-card/50 rounded-xl border border-border/50">
        <p className="text-muted-foreground">No items to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className={`grid gap-6 ${gridCols}`}>
        {displayedItems.map((item) => (
          <ConfigCard key={item.id} {...item} type={type} />
        ))}
      </div>

      {hasMore && (
        <div className="flex flex-col items-center gap-4 pt-8">
          <div className="text-sm text-muted-foreground">
            Showing {displayCount} of {items.length} items
          </div>
          <div className="flex gap-4">
            <Button onClick={loadMore} variant="outline" size="lg" className="min-w-[200px]">
              Load {Math.min(loadMoreCount, remainingCount)} More
            </Button>
            {remainingCount > loadMoreCount && (
              <Button onClick={loadAll} variant="ghost" size="lg">
                Show All ({remainingCount})
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
