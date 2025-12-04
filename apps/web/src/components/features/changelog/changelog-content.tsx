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
import { UnifiedBadge, UI_CLASSES, BADGE_COLORS, STATE_PATTERNS, ANIMATION_CONSTANTS } from '@heyclaude/web-runtime/ui';
import { Plus, GitCompare, CheckCircle, XCircle, AlertTriangle, Shield } from '@heyclaude/web-runtime/icons';

type ChangelogEntry = Database['public']['Tables']['changelog']['Row'];
type ContentRow = Database['public']['Tables']['content']['Row'];
type GuideSection = ContentRow['metadata'];

import { SanitizedHTML } from './sanitized-html';
import { ChangelogAccordionSections } from './changelog-accordion-sections';
import { removeAccordionSectionsFromContent, removeCategorySectionsFromContent } from './changelog-content-utils';
import { markdownToHtml } from '@/src/lib/utils/markdown-to-html';

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
 * Category Icon Map - Icons for each changelog category
 */
const CATEGORY_ICONS = {
  Added: Plus,
  Changed: GitCompare,
  Fixed: CheckCircle,
  Removed: XCircle,
  Deprecated: AlertTriangle,
  Security: Shield,
} as const;

/**
 * Category Section Component - Displays a category of changes
 */
function CategorySection({
  category,
  items,
  icon: Icon,
}: {
  category: Database['public']['Enums']['changelog_category'];
  items: Array<{ content: string }>;
  icon: React.ComponentType<{ className?: string }>;
}) {
  if (!items || items.length === 0) return null;

  const badgeColor =
    BADGE_COLORS.changelogCategory[category as keyof typeof BADGE_COLORS.changelogCategory];

  return (
    <section className={`${UI_CLASSES.MARGIN_COMFORTABLE} ${UI_CLASSES.PADDING_Y_DEFAULT} border-b border-border/50 last:border-b-0`}>
      {/* Category Header */}
      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} ${UI_CLASSES.MARGIN_DEFAULT}`}>
        <Icon className={UI_CLASSES.ICON_MD} />
        <h2 className={UI_CLASSES.HEADING_H3}>{category}</h2>
        <UnifiedBadge
          variant="base"
          style="outline"
          className={`${badgeColor} ${UI_CLASSES.TEXT_LABEL}`}
        >
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </UnifiedBadge>
      </div>

      {/* Change Items List */}
      <ul className={`${UI_CLASSES.FORM_FIELD_SPACING} list-none pl-0`}>
        {items.map((item, index) => (
          <li
            key={index}
            className={`${UI_CLASSES.FLEX_ITEMS_START_GAP_3} ${UI_CLASSES.PADDING_Y_TIGHT} ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} ${STATE_PATTERNS.HOVER_BG_SUBTLE} rounded-md ${UI_CLASSES.PADDING_X_COMPACT}`}
          >
            <span
              className={`${badgeColor} flex-shrink-0 mt-0.5 rounded-full p-1 flex items-center justify-center`}
              aria-hidden="true"
            >
              <Icon className={UI_CLASSES.ICON_SM} />
            </span>
            <div className={`${UI_CLASSES.TEXT_BODY_DEFAULT} flex-1`}>
              <div className="prose prose-slate dark:prose-invert max-w-none prose-sm prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-headings:my-3 prose-headings:text-base prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-strong:text-foreground">
                <TrustedHTML html={markdownToHtml(item.content)} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Render additional content (JSON sections or HTML) after structured changes
 * 
 * @param entry - Changelog entry with content
 * @param metadataSections - Optional JSON sections from generated content
 * @param hasStructuredChanges - Whether structured changes are displayed
 * @returns JSX for additional content sections
 */
function renderAdditionalContent(
  entry: ChangelogEntry,
  metadataSections: GuideSection[] | undefined,
  hasStructuredChanges: boolean
) {
  let rawContent = entry.content || '';

  // Remove accordion sections from content to avoid duplication
  rawContent = removeAccordionSectionsFromContent(rawContent);

  // If we have structured changes, also remove category sections (## Added, ## Changed, etc.)
  // to avoid displaying the same content twice
  if (hasStructuredChanges) {
    rawContent = removeCategorySectionsFromContent(rawContent);
  }

  // Convert markdown to HTML (content is stored as markdown in database)
  const displayContent = rawContent.trim() ? markdownToHtml(rawContent) : '';

  // Only show additional content if there's something meaningful left after removing duplicates
  const hasAdditionalContent = displayContent.trim().length > 0;

  return (
    <>
      {hasStructuredChanges && (metadataSections || hasAdditionalContent) && (
        <div className={`${UI_CLASSES.MARGIN_TOP_RELAXED} ${UI_CLASSES.PADDING_Y_RELAXED} border-t border-border/50`}>
          {metadataSections && metadataSections.length > 0 ? (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <JSONSectionRenderer sections={metadataSections} />
            </div>
          ) : hasAdditionalContent ? (
            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-ul:my-4 prose-ol:my-4 prose-li:my-2 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-semibold prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic">
              <TrustedHTML html={displayContent} />
            </div>
          ) : null}
        </div>
      )}
      {!hasStructuredChanges && metadataSections && metadataSections.length > 0 && (
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <JSONSectionRenderer sections={metadataSections} />
        </div>
      )}
      {!hasStructuredChanges && !metadataSections && hasAdditionalContent && (
        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-ul:my-4 prose-ol:my-4 prose-li:my-2 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-semibold prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic">
          <TrustedHTML html={displayContent} />
        </div>
      )}

      {/* Accordion Sections - Technical Details and Deployment (Client Component) */}
      {entry.content && <ChangelogAccordionSections content={entry.content} />}
    </>
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
  /** Hide header (title/date) - used in timeline view where title is in timeline marker */
  hideHeader?: boolean;
}

/**
 * ChangelogContent Component
 *
 * @example
 * ```tsx
 * <ChangelogContent entry={changelogEntry} sections={sections} />
 * ```
 */
export const ChangelogContent = memo(({ entry, sections, hideHeader = false }: ChangelogContentProps) => {
  // Parse changes JSONB field with type safety
  const changes = parseChangelogChanges(entry.changes);

  const metadataSections =
    sections ??
    (Array.isArray((entry.metadata as { sections?: GuideSection[] } | null)?.sections)
      ? ((entry.metadata as { sections?: GuideSection[] }).sections as GuideSection[])
      : undefined);

  // Get non-empty categories for badge display
  const nonEmptyCategories = (['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'] as const)
    .filter((category): category is Database['public']['Enums']['changelog_category'] => {
      const items = changes[category];
      return items !== undefined && Array.isArray(items) && items.length > 0;
    });

  // Check if we have structured changes to display
  const hasStructuredChanges = Object.values(changes).some(
    (categoryItems) => Array.isArray(categoryItems) && categoryItems.length > 0
  );

  return (
    <article className={`max-w-none ${UI_CLASSES.FORM_SECTION_SPACING}`}>
      {/* Entry Header - Title and Date (hidden in timeline view) */}
      {!hideHeader && (
        <header className={`mb-6 pb-4 border-b border-border/30`}>
          <h2 className={`${UI_CLASSES.HEADING_H2} mb-3`}>
            {entry.title}
          </h2>
          <time
            dateTime={entry.release_date}
            className={`${UI_CLASSES.TEXT_BODY_SM} ${UI_CLASSES.TEXT_HELPER}`}
          >
            {new Date(entry.release_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </header>
      )}

      {/* Category Badges - Subtle, below header */}
      {nonEmptyCategories.length > 0 && (
        <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2} ${UI_CLASSES.PADDING_Y_COMPACT} mb-6`}>
          {nonEmptyCategories.map((category) => (
            <UnifiedBadge
              key={category}
              variant="base"
              style="outline"
              className={`${BADGE_COLORS.changelogCategory[category as keyof typeof BADGE_COLORS.changelogCategory]} ${UI_CLASSES.TEXT_LABEL}`}
            >
              {category}
            </UnifiedBadge>
          ))}
        </div>
      )}

      {/* Structured Changes Display - Beautiful categorized sections */}
      {hasStructuredChanges && (
        <div className={`${UI_CLASSES.MARGIN_COMFORTABLE}`}>
          {(['Added', 'Changed', 'Fixed', 'Security', 'Deprecated', 'Removed'] as const).map(category => {
            const items = changes[category];
            if (!items || items.length === 0) return null;
            return (
              <CategorySection
                key={category}
                category={category}
                items={items}
                icon={CATEGORY_ICONS[category]}
              />
            );
          })}
        </div>
      )}

      {/* Additional Content - Rendered as JSON Sections or HTML */}
      {renderAdditionalContent(entry, metadataSections, hasStructuredChanges)}
    </article>
  );
});

ChangelogContent.displayName = 'ChangelogContent';
