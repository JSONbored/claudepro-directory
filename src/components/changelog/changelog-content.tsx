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
import { MDXRenderer } from '@/src/components/shared/mdx-renderer';
import { Badge } from '@/src/components/ui/badge';
import type { ChangelogEntry } from '@/src/lib/schemas/changelog.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Props for ChangelogContent component
 */
export interface ChangelogContentProps {
  /** Changelog entry to render */
  entry: ChangelogEntry;
}

/**
 * Category badge color mapping (same as ChangelogCard)
 */
const CATEGORY_COLORS: Record<string, string> = {
  Added: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  Changed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  Deprecated: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  Removed: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  Fixed: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  Security: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
};

/**
 * ChangelogContent Component
 *
 * @example
 * ```tsx
 * <ChangelogContent entry={changelogEntry} />
 * ```
 */
export const ChangelogContent = memo(({ entry }: ChangelogContentProps) => {
  // Get non-empty categories for badge display
  const nonEmptyCategories = [];
  if (entry.categories.Added.length > 0) nonEmptyCategories.push('Added');
  if (entry.categories.Changed.length > 0) nonEmptyCategories.push('Changed');
  if (entry.categories.Deprecated.length > 0) nonEmptyCategories.push('Deprecated');
  if (entry.categories.Removed.length > 0) nonEmptyCategories.push('Removed');
  if (entry.categories.Fixed.length > 0) nonEmptyCategories.push('Fixed');
  if (entry.categories.Security.length > 0) nonEmptyCategories.push('Security');

  return (
    <article className={`${UI_CLASSES.SPACE_Y_6} max-w-none`}>
      {/* TL;DR Section */}
      {entry.tldr && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <h2 className="text-sm font-semibold text-primary mb-2">TL;DR</h2>
          <p className="text-sm text-foreground">{entry.tldr}</p>
        </div>
      )}

      {/* Category Badges */}
      {nonEmptyCategories.length > 0 && (
        <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2} py-2`}>
          {nonEmptyCategories.map((category) => (
            <Badge
              key={category}
              variant="outline"
              className={`${CATEGORY_COLORS[category]} font-medium`}
            >
              {category}
            </Badge>
          ))}
        </div>
      )}

      {/* Main Content - Rendered as Markdown */}
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <MDXRenderer source={entry.content} className="changelog-content" />
      </div>
    </article>
  );
});

ChangelogContent.displayName = 'ChangelogContent';
