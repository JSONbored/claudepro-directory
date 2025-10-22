/**
 * Changelog Content Component
 *
 * Renders full changelog entry content with markdown support.
 * Wraps MDXRenderer with changelog-specific styling and structure.
 *
 * Architecture:
 * - Uses existing MDXRenderer for markdown parsing
 * - Applies changelog-specific styles
 * - Displays categorized changes sections
 * - Server component (no client-side JS)
 *
 * Production Standards:
 * - Type-safe props
 * - Semantic HTML structure
 * - Accessible headings hierarchy
 * - Optimized for SEO
 */

import { memo } from 'react';
import { JsonContentRenderer } from '@/src/components/content/json-content-renderer';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import type { ChangelogJson } from '@/src/lib/schemas/changelog.schema';
import { BADGE_COLORS, UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Props for ChangelogContent component
 */
export interface ChangelogContentProps {
  /** Changelog entry to render (JSON format with structured sections) */
  entry: ChangelogJson;
}

/**
 * ChangelogContent Component
 *
 * @example
 * ```tsx
 * <ChangelogContent entry={changelogEntry} />
 * ```
 */
export const ChangelogContent = memo(({ entry }: ChangelogContentProps) => {
  // Get non-empty categories for badge display (from metadata.categories counts)
  const categories = entry.metadata.categories;
  const nonEmptyCategories: Array<{ name: string; count: number }> = [];

  if (categories.Added > 0) nonEmptyCategories.push({ name: 'Added', count: categories.Added });
  if (categories.Changed > 0)
    nonEmptyCategories.push({ name: 'Changed', count: categories.Changed });
  if (categories.Deprecated > 0)
    nonEmptyCategories.push({ name: 'Deprecated', count: categories.Deprecated });
  if (categories.Removed > 0)
    nonEmptyCategories.push({ name: 'Removed', count: categories.Removed });
  if (categories.Fixed > 0) nonEmptyCategories.push({ name: 'Fixed', count: categories.Fixed });
  if (categories.Security > 0)
    nonEmptyCategories.push({ name: 'Security', count: categories.Security });

  return (
    <article className={'space-y-6 max-w-none'}>
      {/* Category Badges with Counts */}
      {nonEmptyCategories.length > 0 && (
        <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2} py-2`}>
          {nonEmptyCategories.map(({ name, count }) => (
            <UnifiedBadge
              key={name}
              variant="base"
              style="outline"
              className={`${BADGE_COLORS.changelogCategory[name as keyof typeof BADGE_COLORS.changelogCategory]} font-medium`}
            >
              {name} ({count})
            </UnifiedBadge>
          ))}
        </div>
      )}

      {/* Structured Content (TL;DR, Tabs, Accordions, etc.) */}
      <JsonContentRenderer json={entry} />
    </article>
  );
});

ChangelogContent.displayName = 'ChangelogContent';
