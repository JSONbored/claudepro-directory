'use client';

/**
 * UnifiedCardGrid Component
 *
 * Consolidated grid layout with infinite scroll and staggered animations.
 * Generic grid component that accepts any card component as a prop.
 *
 * Architecture:
 * - Client-side only (uses hooks, motion)
 * - Accepts card component as prop (generic)
 * - Uses web-runtime hooks (useInfiniteScroll)
 * - Structured logging for errors
 * - Performance optimized with React.memo
 *
 * Features:
 * - Multiple grid variants (normal, tight, wide, list)
 * - Infinite scroll support
 * - Staggered animations
 * - Prefetching support
 * - Error boundaries per card
 * - Loading states
 * - Empty states
 *
 * Usage:
 * ```tsx
 * import { UnifiedCardGrid } from '@heyclaude/web-runtime/ui';
 * import { ConfigCard } from '@/components/cards/config-card';
 *
 * <UnifiedCardGrid
 *   items={contentItems}
 *   cardComponent={ConfigCard}
 *   variant="normal"
 *   infiniteScroll={true}
 * />
 * ```
 */

import { logUnhandledPromise } from '../../../entries/core.ts';
import { useInfiniteScroll } from '../../../hooks/use-infinite-scroll.ts';
import type { DisplayableContent } from '../../../types/component.types.ts';
// Design System imports
import { grid, display, alignItems, justify, padding } from '../../../design-system/styles/layout.ts';
import { size, muted } from '../../../design-system/styles/typography.ts';
import { ErrorBoundary } from '../error-boundary.tsx';
import { ConfigCard } from './config-card.tsx';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import type { ComponentType, ReactNode } from 'react';
import { memo, useEffect } from 'react';

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

/**
 * Card component props interface for UnifiedCardGrid
 */
export interface UnifiedCardGridCardProps {
  item: DisplayableContent;
  variant?: 'default' | 'detailed';
  showCategory?: boolean;
  showActions?: boolean;
  className?: string;
  enableSwipeGestures?: boolean;
  useViewTransitions?: boolean;
  showBorderBeam?: boolean;
  searchQuery?: string;
}

type CardRenderingProps =
  | {
      cardComponent: ComponentType<UnifiedCardGridCardProps>;
      renderCard?: never;
    }
  | {
      renderCard: (item: DisplayableContent, index: number) => ReactNode;
      cardComponent?: never;
    }
  | {
      cardComponent?: never;
      renderCard?: never;
    };

export type UnifiedCardGridProps = BaseGridProps & CardRenderingProps;

const GRID_VARIANTS: Record<GridVariant, string> = {
  normal: grid.responsive3,
  tight: grid.contentTight,
  wide: grid.responsive4,
  list: grid.list,
};

/**
 * UnifiedCardGrid component
 *
 * Generic grid layout with infinite scroll and animations.
 * Accepts any card component as a prop for maximum flexibility.
 */
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

  // Ensure items is always an array (defensive programming)
  const safeItems = Array.isArray(items) ? items : [];

  const router = useRouter();

  useEffect(() => {
    if (prefetchCount > 0 && safeItems.length > 0) {
      const itemsToPrefetch = safeItems.slice(0, prefetchCount);
      for (const item of itemsToPrefetch) {
        if (item.slug && item.category) {
          try {
            const path = `/${item.category}/${item.slug}`;
            router.prefetch(path);
          } catch (error) {
            logUnhandledPromise('UnifiedCardGrid: prefetch failed', error, {
              category: item.category,
              slug: item.slug,
            });
          }
        }
      }
    }
  }, [safeItems, prefetchCount, router]);

  const { displayCount, isLoading, hasMore, sentinelRef } = useInfiniteScroll({
    totalItems: safeItems.length,
    batchSize,
    rootMargin,
    threshold: 0.1,
  });

  const displayedItems = infiniteScroll ? safeItems.slice(0, displayCount) : safeItems;

  useEffect(() => {
    if (infiniteScroll && onFetchMore && displayCount >= safeItems.length && serverHasMore) {
      onFetchMore().catch((error) => {
        logUnhandledPromise('UnifiedCardGrid:onFetchMore', error);
      });
    }
  }, [displayCount, safeItems.length, infiniteScroll, onFetchMore, serverHasMore]);

  const getKey = keyExtractor || ((item: DisplayableContent, index: number) => item.slug || index);

  if (safeItems.length === 0 && !loading) {
    return (
      <output className={`${display.flex} ${alignItems.center} ${justify.center} ${padding.ySection}`} aria-live="polite">
        <p className={`${size.lg} ${muted.default}`}>{emptyMessage}</p>
      </output>
    );
  }

  if (loading) {
    return (
      <output className={`${display.flex} ${alignItems.center} ${justify.center} ${padding.ySection}`} aria-live="polite">
        <p className={`${size.lg} ${muted.default}`}>{loadingMessage}</p>
      </output>
    );
  }

  const gridClassName = GRID_VARIANTS[variant];

  return (
    <section className={className} aria-label={ariaLabel}>
      <div className={gridClassName}>
        {displayedItems.map((item, index) => {
          const key = getKey(item, index);
          let cardContent: ReactNode;
          if (props.renderCard) {
            cardContent = props.renderCard(item, index);
          } else {
            // Use provided cardComponent or default to ConfigCard
            const CardComponent = props.cardComponent || ConfigCard;
            cardContent = (
              <CardComponent
                item={item}
                variant="default"
                showCategory={true}
                showActions={true}
              />
            );
          }

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
          className={`${display.flex} ${alignItems.center} ${justify.center} ${padding.yLoose}`}
          style={{ minHeight: '100px' }}
          aria-live="polite"
          aria-busy={isLoading}
        >
          {isLoading && <p className={`${size.sm} ${muted.default}`}>{loadingMessage}</p>}
        </div>
      )}
    </section>
  );
}

export const UnifiedCardGrid = memo(UnifiedCardGridComponent);

UnifiedCardGrid.displayName = 'UnifiedCardGrid';
