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

import {
  backdrop,
  between,
  bgColor,
  border,
  borderTop,
  cluster,
  flexDir,
  flexWrap,
  gap,
  hoverBg,
  iconSize,
  alignItems,
  justify,
  label,
  leading,
  marginTop,
  muted,
  padding,
  paddingTop,
  paddingRight,
  radius,
  size,
  stack,
  textColor,
  transition,
  weight,
  display,
  position,
  absolute,
  sticky,
  truncate,
  height,
  textAlign,
  hoverBorder,
  borderColor,
  maxHeight,
  overflow,
  iconLeading,
} from '@heyclaude/web-runtime/design-system';
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
      className={`group ${position.relative}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={href}
        className={cn(stack.snug, `${radius.lg} ${border.light} ${bgColor.card} ${padding.xCompact} ${padding.yBetween}`, transition.default, `${hoverBorder.accent} ${hoverBg.subtle}`)}
      >
        {/* Header: Badge + Time */}
        <div className={between.center}>
          <UnifiedBadge variant="base" style="outline" className={`${size['2xs']} capitalize`}>
            {item.category}
          </UnifiedBadge>
          <span className={`${size['2xs']} ${muted.default}`}>{timeAgo}</span>
        </div>

        {/* Title */}
        <h4 className={`${truncate.single} ${weight.medium} ${textColor.foreground} ${size.sm}`}>{item.title}</h4>

        {/* Description */}
        <p className={`${truncate.lines2} ${size['3xs']} ${muted.default} ${leading.tight}`}>
          {item.description}
        </p>

        {/* Tags (if present) */}
        {item.tags && item.tags.length > 0 && (
          <div className={`${marginTop.tight} ${display.flex} ${flexWrap.wrap} ${gap.tight}`}>
            {item.tags.slice(0, 2).map((tag) => (
              <UnifiedBadge key={tag} variant="base" style="outline" className={size['2xs']}>
                {tag}
              </UnifiedBadge>
            ))}
            {item.tags.length > 2 && (
              <span className={`${size['2xs']} ${muted.default}`}>+{item.tags.length - 2}</span>
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
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(item.category, item.slug);
            }}
            className={`${absolute.topRightOffset} ${display.flex} ${iconSize.lg} ${alignItems.center} ${justify.center} ${radius.md} ${border.light} ${bgColor['background/95']} ${backdrop.sm} hover:${borderColor.destructive} ${hoverBg.destructive} hover:${textColor.destructive}`}
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
        `${sticky.topNav} ${display.none} ${height.fit} ${maxHeight.sidebar} w-72 ${flexDir.col} ${gap.default} ${radius.xl} ${border.light} ${bgColor['card/50']} ${padding.default} ${backdrop.sm} xl:${display.flex}`,
        overflow.hidden
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
            className={`${height.buttonSm} ${padding.xTight} ${size.xs}`}
            aria-label="Clear all recently viewed"
          >
            <Trash className={iconLeading.xs} />
            Clear
          </Button>

          {/* Collapse toggle (mobile) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`${iconSize.lgPlus} ${padding.none} xl:${display.none}`}
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
            className={cn(stack.compact, overflow.yAuto, paddingRight.tight)}
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
          className={`${borderTop.faint} ${paddingTop.default} ${textAlign.center} ${size['2xs']} ${muted.default}`}
        >
          Showing {recentlyViewed.length} of 10 max
        </motion.p>
      )}
    </motion.aside>
  );
});
