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

import { changelog_category as ChangelogCategory, type changelog_category } from '@heyclaude/web-runtime/types/client-safe-enums';
import type { ChangelogEntry } from '@heyclaude/web-runtime/types/changelog';
import { parseChangelogChanges } from '@heyclaude/web-runtime/data/changelog.shared';
import { formatDate } from '@heyclaude/web-runtime/data/utils';
import {
  Plus,
  GitCompare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
} from '@heyclaude/web-runtime/icons';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { CHANGELOG_BADGE_COLOR_MAP } from '@heyclaude/web-runtime/ui/constants';
import { memo } from 'react';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic import for JSONSectionRenderer (822 lines) - lazy load for code splitting
const JSONSectionRenderer = dynamic(
  () =>
    import('@/src/components/content/json-to-sections').then((mod) => ({
      default: mod.JSONSectionRenderer,
    })),
  { ssr: true }
);
import { markdownToHtml } from '@/src/lib/utils/markdown-to-html';

import { ChangelogAccordionSections } from './changelog-accordion-sections';
import {
  removeAccordionSectionsFromContent,
  removeCategorySectionsFromContent,
} from './changelog-content-utils';
import { SanitizedHTML } from './sanitized-html';

// ChangelogEntry type imported from web-runtime
// GuideSection is metadata from content - define directly to avoid Prisma import
type GuideSection = Record<string, unknown> | null;

/**
 * Render sanitized HTML content while optionally forwarding `className` and `id`.
 *
 * Renders the provided HTML string using a sanitizing wrapper to prevent unsafe markup.
 *
 * @param props.html - The HTML string to render (already converted from Markdown or other sources).
 * @param props.className - Optional CSS class to apply to the rendered container.
 * @param props.id - Optional id to apply to the rendered container.
 * @returns A React element containing the sanitized HTML.
 *
 * @see SanitizedHTML
 */
function TrustedHTML({ html, className, id }: { className?: string; html: string; id?: string }) {
  return (
    <SanitizedHTML
      html={html}
      {...(className !== undefined && { className })}
      {...(id !== undefined && { id })}
    />
  );
}

// Ordered array of changelog categories from Prisma enum (matches UI display order)
const CHANGELOG_CATEGORIES = Object.values(ChangelogCategory) as readonly changelog_category[];

/**
 * Category Icon Map - Icons for each changelog category
 * Keys must match CHANGELOG_CATEGORIES to ensure type safety
 */
const CATEGORY_ICONS: Record<
  (typeof CHANGELOG_CATEGORIES)[number],
  React.ComponentType<{ className?: string }>
> = {
  Added: Plus,
  Changed: GitCompare,
  Fixed: CheckCircle,
  Removed: XCircle,
  Deprecated: AlertTriangle,
  Security: Shield,
} as const;

/**
 * Render a titled changelog section for a specific category with its items and a count badge.
 *
 * Renders nothing when `items` is empty or undefined.
 *
 * @param props.category - The changelog category label to display as the section heading.
 * @param props.items - Array of change items; each item's `content` is rendered as sanitized HTML.
 * @param props.icon - Icon component used for the section heading and item bullets.
 *
 * @see CATEGORY_ICONS - Maps changelog categories to icon components used by this section.
 * @see TrustedHTML - Component used to safely render converted markdown HTML.
 * @see markdownToHtml - Converts markdown in each item's `content` to HTML before rendering.
 */
function CategorySection({
  category,
  items,
  icon: Icon,
}: {
  category: changelog_category;
  icon: React.ComponentType<{ className?: string }>;
  items: Array<{ content: string }>;
}) {
  if (!items || items.length === 0) return null;

  // Direct Tailwind utilities - no wrapper needed
  const badgeColor = CHANGELOG_BADGE_COLOR_MAP[category];

  return (
    <section className="border-border/50 mb-6 border-b py-4 last:border-b-0">
      {/* Category Header */}
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <h2 className="text-xl font-semibold">{category}</h2>
        <UnifiedBadge variant="base" style="outline" className={`${badgeColor} text-xs-medium`}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </UnifiedBadge>
      </div>

      {/* Change Items List */}
      <ul className="list-none space-y-2 pl-0">
        {items.map((item, index) => (
          <li
            key={index}
            className="hover:bg-accent/5 flex items-start gap-3 rounded-md px-3 py-2 transition-all duration-200 ease-out"
          >
            <span
              className={`${badgeColor} mt-0.5 flex flex-shrink-0 items-center justify-center rounded-full p-1`}
              aria-hidden="true"
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex-1 text-base leading-normal">
              <div className="prose prose-slate dark:prose-invert prose-sm prose-headings:font-semibold prose-headings:text-foreground prose-headings:mt-4 prose-headings:mb-3 prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-li:my-1.5 prose-li:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-muted prose-pre:text-foreground prose-pre:p-3 prose-pre:rounded prose-pre:overflow-x-auto prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:my-3 max-w-none">
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
 * Render supplemental changelog content and accordion sections after structured changes.
 *
 * Depending on whether structured/category changes are displayed, renders either JSON-derived metadata sections
 * or remaining markdown-derived HTML to avoid duplicating category or accordion content, then always renders
 * accordion sections when `entry.content` is present.
 *
 * @param entry - Changelog entry whose `content` (markdown) is the source for additional HTML and accordion sections
 * @param metadataSections - Optional JSON-derived guide sections to render via JSONSectionRenderer
 * @param hasStructuredChanges - If true, category headings are stripped from the markdown to prevent duplicate content
 * @returns A JSX fragment containing the additional content (metadata or sanitized HTML) and accordion sections when applicable
 *
 * @see JSONSectionRenderer
 * @see TrustedHTML
 * @see ChangelogAccordionSections
 * @see removeAccordionSectionsFromContent
 * @see removeCategorySectionsFromContent
 * @see markdownToHtml
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
  const hasMetadataSections = Array.isArray(metadataSections) && metadataSections.length > 0;

  return (
    <>
      {hasStructuredChanges && (hasMetadataSections || hasAdditionalContent) ? (
        <div className="border-border/50 mt-8 border-t py-8">
          {hasMetadataSections ? (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <Suspense fallback={<div className="h-32" />}>
                <JSONSectionRenderer sections={metadataSections} />
              </Suspense>
            </div>
          ) : hasAdditionalContent ? (
            <div className="prose prose-slate dark:prose-invert prose-sm md:prose-base prose-headings:font-semibold prose-headings:text-foreground prose-headings:mt-6 prose-headings:mb-4 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-4 prose-ul:my-4 prose-ol:my-4 prose-li:my-2 prose-li:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-semibold prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:text-foreground prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4 prose-hr:my-8 max-w-none">
              <TrustedHTML html={displayContent} />
            </div>
          ) : null}
        </div>
      ) : null}
      {!hasStructuredChanges && hasMetadataSections ? (
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <Suspense fallback={<div className="h-32" />}>
            <JSONSectionRenderer sections={metadataSections} />
          </Suspense>
        </div>
      ) : null}
      {!hasStructuredChanges && !hasMetadataSections && hasAdditionalContent ? (
        <div className="prose prose-slate dark:prose-invert prose-sm md:prose-base prose-headings:font-semibold prose-headings:text-foreground prose-headings:mt-6 prose-headings:mb-4 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-4 prose-ul:my-4 prose-ol:my-4 prose-li:my-2 prose-li:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-semibold prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:text-foreground prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4 prose-hr:my-8 max-w-none">
          <TrustedHTML html={displayContent} />
        </div>
      ) : null}

      {/* Accordion Sections - Technical Details and Deployment (Client Component) */}
      {entry.content ? <ChangelogAccordionSections content={entry.content} /> : null}
    </>
  );
}

/**
 * Props for ChangelogContent component
 */
export interface ChangelogContentProps {
  /** Changelog entry to render */
  entry: ChangelogEntry;
  /** Hide header (title/date) - used in timeline view where title is in timeline marker */
  hideHeader?: boolean;
  /** Optional JSON sections (from generated content) */
  sections?: GuideSection[];
  /** Callback to set header ref for timeline alignment */
  onHeaderRef?: (element: HTMLElement | null) => void;
}

/**
 * ChangelogContent Component
 *
 * @example
 * ```tsx
 * <ChangelogContent entry={changelogEntry} sections={sections} />
 * ```
 */
export const ChangelogContent = memo(
  ({ entry, sections, hideHeader = false, onHeaderRef }: ChangelogContentProps) => {
    // Parse changes JSONB field with type safety
    const changes = parseChangelogChanges(entry.changes);

    const metadataSections =
      sections ??
      (Array.isArray((entry.metadata as null | { sections?: GuideSection[] })?.sections)
        ? ((entry.metadata as { sections?: GuideSection[] }).sections as GuideSection[])
        : undefined);

    // Get non-empty categories for badge display
    const nonEmptyCategories = CHANGELOG_CATEGORIES.filter(
      (category): category is changelog_category => {
        const items = changes[category];
        return items !== undefined && Array.isArray(items) && items.length > 0;
      }
    );

    // Check if we have structured changes to display
    const hasStructuredChanges = Object.values(changes).some(
      (categoryItems) => Array.isArray(categoryItems) && categoryItems.length > 0
    );

    return (
      <article className="max-w-none space-y-6">
        {/* Entry Header - Title and Date (always rendered for timeline alignment, visually hidden if hideHeader=true) */}
        <header
          ref={onHeaderRef}
          className={`border-border/30 mb-6 scroll-mt-24 border-b pb-4 ${hideHeader ? 'sr-only' : ''}`}
          id={`changelog-entry-header-${entry.slug}`}
        >
          <h2 className="mb-4 text-2xl font-bold">{entry.title}</h2>
          <time
            dateTime={
              entry.release_date instanceof Date
                ? entry.release_date.toISOString()
                : entry.release_date
            }
            className="text-muted-foreground text-sm leading-relaxed"
          >
            {formatDate(
              entry.release_date instanceof Date ? entry.release_date : entry.release_date,
              'long'
            )}
          </time>
        </header>

        {/* Category Badges - Subtle, below header */}
        {nonEmptyCategories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2 py-3">
            {nonEmptyCategories.map((category) => (
              <UnifiedBadge
                key={category}
                variant="base"
                style="outline"
                className={`${CHANGELOG_BADGE_COLOR_MAP[category]} text-sm-medium text-foreground`}
              >
                {category}
              </UnifiedBadge>
            ))}
          </div>
        )}

        {/* Structured Changes Display - Beautiful categorized sections */}
        {hasStructuredChanges ? (
          <div className="mb-6">
            {CHANGELOG_CATEGORIES.map((category) => {
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
        ) : null}

        {/* Additional Content - Rendered as JSON Sections or HTML */}
        {renderAdditionalContent(entry, metadataSections, hasStructuredChanges)}
      </article>
    );
  }
);

ChangelogContent.displayName = 'ChangelogContent';
