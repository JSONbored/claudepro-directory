/**
 * Changelog Content Component
 *
 * Renders full changelog entry content using JSON sections.
 * Uses JSONSectionRenderer for consistent rendering with guides.
 *
 * Architecture:
 * - Uses JSONSectionRenderer (same as guides)
 * - Processes structured JSON sections from build system
 * - Displays categorized changes sections
 * - Server component (no client-side JS)
 *
 * Production Standards:
 * - Type-safe props
 * - Semantic HTML structure
 * - Accessible headings hierarchy
 * - Optimized for SEO
 * - No MDX dependencies
 */

import { memo } from 'react';
import { JSONSectionRenderer } from '@/src/components/content/json-section-renderer';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import type { ChangelogEntry } from '@/src/lib/schemas/changelog.schema';
import type { GuideSection } from '@/src/lib/schemas/content/guide.schema';
import { BADGE_COLORS, UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Props for ChangelogContent component
 */
export interface ChangelogContentProps {
  /** Changelog entry to render */
  entry: ChangelogEntry;
  /** Optional JSON sections (from generated content) */
  sections?: GuideSection[];
}

/**
 * ChangelogContent Component
 *
 * @example
 * ```tsx
 * <ChangelogContent entry={changelogEntry} sections={sections} />
 * ```
 */
export const ChangelogContent = memo(({ entry, sections }: ChangelogContentProps) => {
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

      {/* Main Content - Rendered as JSON Sections */}
      {sections && sections.length > 0 ? (
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <JSONSectionRenderer sections={sections} />
        </div>
      ) : (
        // Fallback for entries without sections (shouldn't happen after build)
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: entry.content }} />
        </div>
      )}
    </article>
  );
});

ChangelogContent.displayName = 'ChangelogContent';
