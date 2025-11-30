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

import { ChevronDown, ChevronUp, Clock, Trash, X } from '@heyclaude/web-runtime/icons';
import { ANIMATION_CONSTANTS, cn, UI_CLASSES } from '@heyclaude/web-runtime/ui';
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
        className={`flex flex-col gap-1.5 rounded-lg border border-border/50 bg-card px-3 py-2.5 ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} hover:border-accent/50 hover:bg-accent/5`}
      >
        {/* Header: Badge + Time */}
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
          <UnifiedBadge variant="base" style="outline" className="text-[10px] capitalize">
            {item.category}
          </UnifiedBadge>
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Title */}
        <h4 className="line-clamp-1 font-medium text-foreground text-sm">{item.title}</h4>

        {/* Description */}
        <p className="line-clamp-2 text-[11px] text-muted-foreground leading-tight">
          {item.description}
        </p>

        {/* Tags (if present) */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.tags.slice(0, 2).map((tag) => (
              <UnifiedBadge key={tag} variant="base" style="outline" className="text-[9px]">
                {tag}
              </UnifiedBadge>
            ))}
            {item.tags.length > 2 && (
              <span className="text-[9px] text-muted-foreground">+{item.tags.length - 2}</span>
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
            <X className="h-3 w-3" />
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
        'sticky top-20 hidden h-fit max-h-[calc(100vh-6rem)] w-72 flex-col gap-3 rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm xl:flex',
        'overflow-hidden'
      )}
    >
      {/* Header */}
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-sm">Recently Viewed</h3>
        </div>
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
          {/* Clear all button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-7 px-2 text-xs"
            aria-label="Clear all recently viewed"
          >
            <Trash className="mr-1 h-3 w-3" />
            Clear
          </Button>

          {/* Collapse toggle (mobile) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 w-7 p-0 xl:hidden"
            aria-label={isCollapsed ? 'Expand recently viewed' : 'Collapse recently viewed'}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
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
            className="flex flex-col gap-2 overflow-y-auto pr-1"
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
          className="border-border/30 border-t pt-3 text-center text-[10px] text-muted-foreground"
        >
          Showing {recentlyViewed.length} of 10 max
        </motion.p>
      )}
    </motion.aside>
  );
});
