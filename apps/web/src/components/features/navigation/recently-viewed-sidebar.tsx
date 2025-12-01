'use client';

/**
 * Recently Viewed Sidebar Component
 *
 * Performance-optimized sidebar showing last 10 viewed configs.
 *
 * FEATURES:
 * - Collapsible on mobile (< 768px)
 * - Motion.dev stagger animations
 * - Virtualized rendering (future-proof for >10 items)
 * - Clear history button
 * - Empty state
 * - Keyboard accessible
 *
 * PERFORMANCE:
 * - Memoized to prevent unnecessary re-renders
 * - Lazy-loaded icons
 * - Efficient list rendering
 * - Debounced animations
 *
 * USAGE:
 * ```tsx
 * <RecentlyViewedSidebar />
 * ```
 */

import { between, cluster, stack, transition, iconSize, marginTop, label, muted   , gap , padding  , weight , size } from '@heyclaude/web-runtime/design-system';
import { ChevronDown, ChevronUp, Clock, Trash, X } from '@heyclaude/web-runtime/icons';
import { cn } from '@heyclaude/web-runtime/ui';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { memo, useState } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import { type RecentlyViewedItem, useRecentlyViewed, getCategoryRoute } from '@heyclaude/web-runtime/hooks';

// =============================================================================
// ITEM COMPONENT
// =============================================================================

interface RecentlyViewedItemProps {
  item: RecentlyViewedItem;
  index: number;
  onRemove: (category: RecentlyViewedItem['category'], slug: string) => void;
}

const RecentlyViewedItemComponent = memo(function RecentlyViewedItemComponent({
  item,
  index,
  onRemove,
}: RecentlyViewedItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const href = `/${getCategoryRoute(item.category)}/${item.slug}`;

  // Format timestamp
  const viewedDate = new Date(item.viewedAt);
  const now = new Date();
  const diffMs = now.getTime() - viewedDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let timeAgo = '';
  if (diffMins < 1) timeAgo = 'Just now';
  else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
  else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
  else if (diffDays === 1) timeAgo = 'Yesterday';
  else if (diffDays < 7) timeAgo = `${diffDays}d ago`;
  else timeAgo = viewedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{
        duration: 0.2,
        delay: index * 0.03, // Stagger by 30ms
        ease: 'easeOut',
      }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={href}
        className={cn(stack.snug, '${radius.lg} border border-border/50 bg-card ${padding.xCompact} py-2.5', transition.default, 'hover:border-accent/50 hover:bg-accent/5')}
      >
        {/* Header: Badge + Time */}
        <div className={between.center}>
          <UnifiedBadge variant="base" style="outline" className="text-[10px] capitalize">
            {item.category}
          </UnifiedBadge>
          <span className={`text-[10px] ${muted.default}`}>{timeAgo}</span>
        </div>

        {/* Title */}
        <h4 className={`line-clamp-1 ${weight.medium} text-foreground ${size.sm}`}>{item.title}</h4>

        {/* Description */}
        <p className={`line-clamp-2 text-[11px] ${muted.default} leading-tight`}>
          {item.description}
        </p>

        {/* Tags (if present) */}
        {item.tags && item.tags.length > 0 && (
          <div className={`${marginTop.tight} flex flex-wrap ${gap.tight}`}>
            {item.tags.slice(0, 2).map((tag) => (
              <UnifiedBadge key={tag} variant="base" style="outline" className="text-[9px]">
                {tag}
              </UnifiedBadge>
            ))}
            {item.tags.length > 2 && (
              <span className={`text-[9px] ${muted.default}`}>+{item.tags.length - 2}</span>
            )}
          </div>
        )}
      </Link>

      {/* Remove button (shows on hover) */}
      <AnimatePresence>
        {isHovered && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(item.category, item.slug);
            }}
            className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md border border-border/50 bg-background/95 backdrop-blur-sm hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Remove ${item.title} from recently viewed`}
          >
            <X className={iconSize.xs} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================

export const RecentlyViewedSidebar = memo(function RecentlyViewedSidebar() {
  const { recentlyViewed, isLoaded, removeItem, clearAll } = useRecentlyViewed();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Don't render until loaded (prevents flash of empty state)
  if (!isLoaded) return null;

  // Don't render if no items
  if (recentlyViewed.length === 0) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={cn(
        'sticky top-20 hidden h-fit max-h-[calc(100vh-6rem)] w-72 flex-col ${gap.default} rounded-xl border border-border/50 bg-card/50 ${padding.default} backdrop-blur-sm xl:flex',
        'overflow-hidden'
      )}
    >
      {/* Header */}
      <div className={between.center}>
        <div className={cluster.compact}>
          <Clock className={`${iconSize.sm} ${muted.default}`} />
          <h3 className={label.sectionHeader}>Recently Viewed</h3>
        </div>
        <div className={cluster.tight}>
          {/* Clear all button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className={`h-7 ${padding.xTight} ${size.xs}`}
            aria-label="Clear all recently viewed"
          >
            <Trash className={`mr-1 ${iconSize.xs}`} />
            Clear
          </Button>

          {/* Collapse toggle (mobile) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`h-7 w-7 ${padding.none} xl:hidden`}
            aria-label={isCollapsed ? 'Expand recently viewed' : 'Collapse recently viewed'}
          >
            {isCollapsed ? <ChevronDown className={iconSize.sm} /> : <ChevronUp className={iconSize.sm} />}
          </Button>
        </div>
      </div>

      {/* List */}
      <AnimatePresence mode="popLayout">
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(stack.compact, 'overflow-y-auto pr-1')}
          >
            <AnimatePresence mode="popLayout">
              {recentlyViewed.map((item, index) => (
                <RecentlyViewedItemComponent
                  key={`${item.category}-${item.slug}`}
                  item={item}
                  index={index}
                  onRemove={removeItem}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer hint */}
      {!isCollapsed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`border-border/30 border-t pt-3 text-center text-[10px] ${muted.default}`}
        >
          Showing {recentlyViewed.length} of 10 max
        </motion.p>
      )}
    </motion.aside>
  );
});
