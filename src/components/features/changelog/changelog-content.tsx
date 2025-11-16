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
import { JSONSectionRenderer } from '@/src/components/content/json-to-sections';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import type { ChangelogEntry } from '@/src/lib/data/changelog';
import { parseChangelogChanges } from '@/src/lib/data/changelog';
import type { Database } from '@/src/types/database.types';
import type { ChangelogCategory } from '@/src/types/database-overrides';

type ContentRow = Database['public']['Tables']['content']['Row'];
type GuideSection = ContentRow['metadata'];

import { BADGE_COLORS, UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * TrustedHTML - Safe wrapper for owner-controlled HTML content
 * Same implementation as json-section-renderer.tsx
 */
function TrustedHTML({ html, className, id }: { html: string; className?: string; id?: string }) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is from git commit messages, validated during build
  return <div id={id} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

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
  // Parse changes JSONB field with type safety
  const changes = parseChangelogChanges(entry.changes);

  const metadataSections =
    sections ??
    (Array.isArray((entry.metadata as { sections?: GuideSection[] } | null)?.sections)
      ? ((entry.metadata as { sections?: GuideSection[] }).sections as GuideSection[])
      : undefined);

  // Get non-empty categories for badge display
  const nonEmptyCategories: ChangelogCategory[] = [];
  if (changes.Added && changes.Added.length > 0)
    nonEmptyCategories.push('Added' as ChangelogCategory);
  if (changes.Changed && changes.Changed.length > 0)
    nonEmptyCategories.push('Changed' as ChangelogCategory);
  if (changes.Deprecated && changes.Deprecated.length > 0)
    nonEmptyCategories.push('Deprecated' as ChangelogCategory);
  if (changes.Removed && changes.Removed.length > 0)
    nonEmptyCategories.push('Removed' as ChangelogCategory);
  if (changes.Fixed && changes.Fixed.length > 0)
    nonEmptyCategories.push('Fixed' as ChangelogCategory);
  if (changes.Security && changes.Security.length > 0)
    nonEmptyCategories.push('Security' as ChangelogCategory);

  return (
    <article className={'max-w-none space-y-6'}>
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
      {metadataSections && metadataSections.length > 0 ? (
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <JSONSectionRenderer sections={metadataSections} />
        </div>
      ) : (
        // Fallback for entries without sections (shouldn't happen after build)
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <TrustedHTML html={entry.content} />
        </div>
      )}
    </article>
  );
});

ChangelogContent.displayName = 'ChangelogContent';
