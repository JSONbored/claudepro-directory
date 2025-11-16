'use client';

/**
 * Consolidated grid layout with infinite scroll and staggered animations
 */

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { memo, useEffect } from 'react';
import { ConfigCard } from '@/src/components/core/domain/cards/config-card';
import { ErrorBoundary } from '@/src/components/core/infra/error-boundary';
import { InlineSpinner } from '@/src/components/primitives/feedback/loading-factory';
import { useInfiniteScroll } from '@/src/hooks/use-infinite-scroll';
import type { DisplayableContent } from '@/src/lib/types/component.types';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { logUnhandledPromise } from '@/src/lib/utils/error.utils';

export type GridVariant = 'normal' | 'tight' | 'wide' | 'list';

interface BaseGridProps {
  items: readonly DisplayableContent[];
  variant?: GridVariant;
  className?: string;
  infiniteScroll?: boolean;
  batchSize?: number;
  rootMargin?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  loading?: boolean;
  ariaLabel?: string;
  keyExtractor?: (item: DisplayableContent, index: number) => string | number;
  prefetchCount?: number;
  onFetchMore?: () => Promise<void>;
  serverHasMore?: boolean;
}

type CardRenderingProps =
  | {
      cardComponent: typeof ConfigCard;
      renderCard?: never;
    }
  | {
      renderCard: (item: DisplayableContent, index: number) => ReactNode;
      cardComponent?: never;
    };

export type UnifiedCardGridProps = BaseGridProps & CardRenderingProps;

const GRID_VARIANTS: Record<GridVariant, string> = {
  normal: UI_CLASSES.GRID_RESPONSIVE_3,
  tight: UI_CLASSES.GRID_RESPONSIVE_3_TIGHT,
  wide: UI_CLASSES.GRID_RESPONSIVE_4,
  list: UI_CLASSES.GRID_RESPONSIVE_LIST,
};
function UnifiedCardGridComponent(props: UnifiedCardGridProps) {
  const {
    items,
    variant = 'normal',
    className = '',
    infiniteScroll = false,
    batchSize = 30,
    rootMargin = '400px',
    emptyMessage = 'No items found',
    loadingMessage = 'Loading more...',
    loading = false,
    ariaLabel,
    keyExtractor,
    prefetchCount = 0,
    onFetchMore,
    serverHasMore = false,
  } = props;

  const router = useRouter();

  useEffect(() => {
    if (prefetchCount > 0 && items.length > 0) {
      const itemsToPrefetch = items.slice(0, prefetchCount);
      for (const item of itemsToPrefetch) {
        const path = `/${item.category}/${item.slug}`;
        router.prefetch(path);
      }
    }
  }, [items, prefetchCount, router]);

  const { displayCount, isLoading, hasMore, sentinelRef } = useInfiniteScroll({
    totalItems: items.length,
    batchSize,
    rootMargin,
    threshold: 0.1,
  });

  const displayedItems = infiniteScroll ? items.slice(0, displayCount) : items;

  useEffect(() => {
    if (infiniteScroll && onFetchMore && displayCount >= items.length && serverHasMore) {
      onFetchMore().catch((error) => {
        logUnhandledPromise('UnifiedCardGrid:onFetchMore', error);
      });
    }
  }, [displayCount, items.length, infiniteScroll, onFetchMore, serverHasMore]);

  const getKey = keyExtractor || ((item: DisplayableContent, index: number) => item.slug || index);

  if (items.length === 0 && !loading) {
    return (
      <output className="flex items-center justify-center py-12" aria-live="polite">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </output>
    );
  }

  if (loading) {
    return (
      <output className="flex items-center justify-center py-12" aria-live="polite">
        <InlineSpinner size="sm" message={loadingMessage} />
      </output>
    );
  }

  const gridClassName = GRID_VARIANTS[variant];

  return (
    <section className={className} aria-label={ariaLabel}>
      <div className={gridClassName}>
        {displayedItems.map((item, index) => {
          const key = getKey(item, index);
          const cardContent: ReactNode =
            'renderCard' in props ? props.renderCard(item, index) : <ConfigCard item={item} />;
          return (
            <ErrorBoundary key={key}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: (index % batchSize) * 0.03,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                {cardContent}
              </motion.div>
            </ErrorBoundary>
          );
        })}
      </div>

      {infiniteScroll && (hasMore || serverHasMore) && (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center py-8"
          style={{ minHeight: '100px' }}
          aria-live="polite"
          aria-busy={isLoading}
        >
          {isLoading && <InlineSpinner size="sm" message={loadingMessage} />}
        </div>
      )}
    </section>
  );
}

export const UnifiedCardGrid = memo(UnifiedCardGridComponent);
