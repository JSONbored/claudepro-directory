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
// TODO: Restore when changelog migration to JSON is complete
// import { MDXRenderer } from '@/src/components/content/mdx-renderer';
const MDXRenderer = ({ source, className }: { source: string; className?: string }) => (
  <div className={className} dangerouslySetInnerHTML={{ __html: source }} />
);
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import type { ChangelogEntry } from '@/src/lib/schemas/changelog.schema';
import { BADGE_COLORS, UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Props for ChangelogContent component
 */
export interface ChangelogContentProps {
  /** Changelog entry to render */
  entry: ChangelogEntry;
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
  // Get non-empty categories for badge display
  const nonEmptyCategories = [];
  if (entry.categories.Added.length > 0) nonEmptyCategories.push('Added');
  if (entry.categories.Changed.length > 0) nonEmptyCategories.push('Changed');
  if (entry.categories.Deprecated.length > 0) nonEmptyCategories.push('Deprecated');
  if (entry.categories.Removed.length > 0) nonEmptyCategories.push('Removed');
  if (entry.categories.Fixed.length > 0) nonEmptyCategories.push('Fixed');
  if (entry.categories.Security.length > 0) nonEmptyCategories.push('Security');

  return (
    <article className={'space-y-6 max-w-none'}>
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
            <UnifiedBadge
              key={category}
              variant="base"
              style="outline"
              className={`${BADGE_COLORS.changelogCategory[category as keyof typeof BADGE_COLORS.changelogCategory]} font-medium`}
            >
              {category}
            </UnifiedBadge>
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
