'use client';

/**
 * Category Tag Strip Component
 *
 * Displays the most popular tags for a specific category
 * with subtle animations and interactive hover states.
 *
 * Features:
 * - Extracts unique tags from category items
 * - Animated entrance with stagger
 * - Hover effects with category color
 * - Links to tag pages filtered by category
 *
 * @module features/category/category-tag-strip
 */

import type { Database } from '@heyclaude/database-types';
import { formatTagForDisplay } from '@heyclaude/web-runtime/data/tag-utils';
import {
  animateDuration,
  animation,
  backdrop,
  bgColor,
  border,
  borderColor,
  cluster,
  colors,
  flexWrap,
  gap,
  hoverBorder,
  hoverText,
  iconSize,
  muted,
  padding,
  radius,
  shadow,
  size,
  spaceY,
  transition,
  weight,
} from '@heyclaude/web-runtime/design-system';
import { Tag } from '@heyclaude/web-runtime/icons';
import { cn } from '@heyclaude/web-runtime/ui';
import { motion, useInView } from 'motion/react';
import Link from 'next/link';
import { useRef, useMemo } from 'react';

type ContentCategory = Database['public']['Enums']['content_category'];

/**
 * Safely get category color with fallback to default
 */
function getCategoryColor(category: ContentCategory): string {
  const categoryColors = colors.category as Record<string, { base: string } | undefined>;
  return categoryColors[category]?.base ?? colors.category.default.base;
}

interface CategoryTagStripProps {
  /** Content items to extract tags from */
  items: Array<{ tags?: string[] | null }>;
  /** Current category for styling and filtering */
  category: ContentCategory;
  /** Maximum number of tags to show */
  maxTags?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Extract and count unique tags from items
 */
function extractTopTags(
  items: Array<{ tags?: string[] | null }>,
  maxTags: number
): Array<{ tag: string; count: number }> {
  const tagCounts = new Map<string, number>();

  for (const item of items) {
    if (item.tags) {
      for (const tag of item.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
  }

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTags)
    .map(([tag, count]) => ({ tag, count }));
}

/**
 * Individual tag pill with animations
 */
function TagPill({
  tag,
  count,
  index,
  category,
  categoryColor,
  isInView,
}: {
  tag: string;
  count: number;
  index: number;
  category: ContentCategory;
  categoryColor: string;
  isInView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: -10 }}
      animate={
        isInView
          ? { opacity: 1, scale: 1, x: 0 }
          : { opacity: 0, scale: 0.9, x: -10 }
      }
      transition={{
        duration: 0.4,
        delay: index * animation.stagger.fast,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={`/tags/${encodeURIComponent(tag)}?category=${category}`}
        className={cn(
          'group',
          border.default,
          backdrop.sm,
          transition.all,
          hoverBorder.accent,
          shadow.md,
          cluster.snug,
          radius.full,
          borderColor['border/40'],
          padding.xCompact,
          padding.ySnug,
          animateDuration.default
        )}
        style={{
          ['--tag-color' as string]: categoryColor,
        }}
      >
        <Tag
          className={cn(iconSize.xs, muted.default, transition.colors, 'group-hover:text-[var(--tag-color)]')}
        />
        <span className={cn(weight.medium, size.sm, transition.colors, 'group-hover:text-[var(--tag-color)]')}>
          {formatTagForDisplay(tag)}
        </span>
        <span
          className={cn(
            'tabular-nums',
            radius.full,
            size.xs,
            transition.colors,
            'group-hover:bg-[var(--tag-color)]/10 group-hover:text-[var(--tag-color)]',
            bgColor['muted/50'],
            padding.xSnug,
            padding.yHair
          )}
        >
          {count}
        </span>
      </Link>
    </motion.div>
  );
}

/**
 * Main category tag strip component
 */
export function CategoryTagStrip({
  items,
  category,
  maxTags = 8,
  className,
}: CategoryTagStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.5 });

  const topTags = useMemo(() => extractTopTags(items, maxTags), [items, maxTags]);

  // Get category color
  const categoryColor = getCategoryColor(category);

  if (topTags.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className={cn(spaceY.default, className)}>
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.4 }}
        className={cn(cluster.tight, muted.sm)}
      >
        <Tag className={iconSize.sm} />
        <span>Popular in this category</span>
      </motion.div>

      {/* Tags row */}
      <div className={cn('flex', flexWrap.wrap, gap.compact)}>
        {topTags.map((tagData, index) => (
          <TagPill
            key={tagData.tag}
            tag={tagData.tag}
            count={tagData.count}
            index={index}
            category={category}
            categoryColor={categoryColor}
            isInView={isInView}
          />
        ))}

        {/* "View all" link */}
        {items.length > maxTags && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: maxTags * animation.stagger.fast }}
          >
            <Link
              href={`/tags?category=${category}`}
              className={cn(
                border.dashedSubtle,
                padding.xCompact,
                transition.colors,
                hoverBorder.accent,
                hoverText.foreground,
                cluster.tight,
                radius.full,
                padding.ySnug,
                size.sm,
                muted.default
              )}
            >
              View all tags →
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
