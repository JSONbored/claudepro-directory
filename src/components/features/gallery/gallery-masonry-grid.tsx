/**
 * GalleryMasonryGrid - Pinterest-style masonry layout with infinite scroll
 * Uses Intersection Observer for performance-optimized lazy loading
 */

'use client';

import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { GalleryCard, type GalleryCardProps } from './gallery-card';

interface GalleryMasonryGridProps {
  initialItems: GalleryCardProps[];
  category?: string;
  itemsPerPage?: number;
}

export function GalleryMasonryGrid({
  initialItems,
  category,
  itemsPerPage = 20,
}: GalleryMasonryGridProps) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= itemsPerPage);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(itemsPerPage),
        ...(category && { category }),
      });

      const response = await fetch(`/api/gallery?${params}`);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        setItems((prev) => [...prev, ...data.items]);
        setPage((prev) => prev + 1);
        setHasMore(data.items.length >= itemsPerPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      logger.error('Failed to load more gallery items', error as Error, {
        category: category || 'all',
        page,
        source: 'GalleryMasonryGrid',
      });
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, category, itemsPerPage]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore, hasMore, loading]);

  return (
    <div className="w-full">
      {/* Masonry Grid - CSS Grid with auto-flow dense */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
        {items.map((item, index) => (
          <GalleryCard key={`${item.category}-${item.slug}-${index}`} {...item} />
        ))}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-12"
        >
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading more...</span>
          </div>
        </motion.div>
      )}

      {/* Intersection Observer Target */}
      <div ref={observerTarget} className="h-4" aria-hidden="true" />

      {/* End of Results Message */}
      {!hasMore && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-12"
        >
          <p className="text-sm text-muted-foreground">You've reached the end of the gallery</p>
        </motion.div>
      )}

      {/* Empty State */}
      {items.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
            <span className="text-3xl">📸</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">No screenshots yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Be the first to create and share code screenshots from this category
          </p>
        </motion.div>
      )}
    </div>
  );
}
