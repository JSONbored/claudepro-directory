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

import type { Database } from '@heyclaude/database-types';
import { parseChangelogChanges } from '@heyclaude/web-runtime/data';
import { memo } from 'react';
import { JSONSectionRenderer } from '@/src/components/content/json-to-sections';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';

type ChangelogEntry = Database['public']['Tables']['changelog']['Row'];
type ContentRow = Database['public']['Tables']['content']['Row'];
type GuideSection = ContentRow['metadata'];

import {
  changelogBadge,
  flexWrap,
  gap,
  maxWidth,
  padding,
  spaceY,
  weight,
} from '@heyclaude/web-runtime/design-system';
import { SanitizedHTML } from './sanitized-html';

/**
 * TrustedHTML - Safe wrapper for HTML content with sanitization
 * Uses SanitizedHTML client component for XSS protection
 */
function TrustedHTML({ html, className, id }: { html: string; className?: string; id?: string }) {
  return (
    <SanitizedHTML
      html={html}
      {...(className !== undefined && { className })}
      {...(id !== undefined && { id })}
    />
  );
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
  const nonEmptyCategories: Database['public']['Enums']['changelog_category'][] = [];
  if (changes.Added && changes.Added.length > 0)
    nonEmptyCategories.push('Added' as Database['public']['Enums']['changelog_category']);
  if (changes.Changed && changes.Changed.length > 0)
    nonEmptyCategories.push('Changed' as Database['public']['Enums']['changelog_category']);
  if (changes.Deprecated && changes.Deprecated.length > 0)
    nonEmptyCategories.push('Deprecated' as Database['public']['Enums']['changelog_category']);
  if (changes.Removed && changes.Removed.length > 0)
    nonEmptyCategories.push('Removed' as Database['public']['Enums']['changelog_category']);
  if (changes.Fixed && changes.Fixed.length > 0)
    nonEmptyCategories.push('Fixed' as Database['public']['Enums']['changelog_category']);
  if (changes.Security && changes.Security.length > 0)
    nonEmptyCategories.push('Security' as Database['public']['Enums']['changelog_category']);

  return (
    <article className={`max-w-none ${spaceY.relaxed}`}>
      {/* Category Badges */}
      {nonEmptyCategories.length > 0 && (
        <div className={`flex ${flexWrap.wrap} ${gap.compact} ${padding.yCompact}`}>
          {nonEmptyCategories.map((category) => (
            <UnifiedBadge
              key={category}
              variant="base"
              style="outline"
              className={`${changelogBadge[category as keyof typeof changelogBadge]} ${weight.medium}`}
            >
              {category}
            </UnifiedBadge>
          ))}
        </div>
      )}

      {/* Main Content - Rendered as JSON Sections */}
      {metadataSections && metadataSections.length > 0 ? (
        <div className={`prose prose-slate dark:prose-invert ${maxWidth.none}`}>
          <JSONSectionRenderer sections={metadataSections} />
        </div>
      ) : (
        // Fallback for entries without sections (shouldn't happen after build)
        <div className={`prose prose-slate dark:prose-invert ${maxWidth.none}`}>
          <TrustedHTML html={entry.content} />
        </div>
      )}
    </article>
  );
});

ChangelogContent.displayName = 'ChangelogContent';
