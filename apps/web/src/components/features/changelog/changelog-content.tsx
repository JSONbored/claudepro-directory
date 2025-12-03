/**
 * Changelog Content Component
 *
 * Beautifully renders changelog entry content from structured JSONB data.
 * Displays categorized changes with icons, proper spacing, and visual hierarchy.
 *
 * Architecture:
 * - Renders structured `changes` JSONB field by category
 * - Uses design system utilities for consistent styling
 * - Falls back to metadata sections or raw content if needed
 * - Server component (no client-side JS)
 *
 * Production Standards:
 * - Type-safe props
 * - Semantic HTML structure
 * - Accessible headings hierarchy
 * - Optimized for SEO
 * - Beautiful visual design with icons and spacing
 */

import type { Database } from '@heyclaude/database-types';
import { parseChangelogChanges } from '@heyclaude/web-runtime/data';
import { memo } from 'react';
import { JSONSectionRenderer } from '@/src/components/content/json-to-sections';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';

type ChangelogEntry = Database['public']['Tables']['changelog']['Row'];
type ContentRow = Database['public']['Tables']['content']['Row'];
type GuideSection = ContentRow['metadata'];
type ChangelogCategory = Database['public']['Enums']['changelog_category'];

import {
  changelogBadge,
  weight,
  gap,
  padding,
  maxWidth,
  spaceY,
  marginBottom,
  marginTop,
  muted,
  size,
  iconSize,
  radius,
  border,
} from '@heyclaude/web-runtime/design-system';
import { Plus, RefreshCw, Settings, Trash, AlertTriangle, Shield } from '@heyclaude/web-runtime/icons';
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
 * Category configuration with icons and styling
 */
const CATEGORY_CONFIG: Record<
  ChangelogCategory,
  {
    icon: typeof Plus;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  Added: {
    icon: Plus,
    color: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    label: 'Added',
  },
  Changed: {
    icon: RefreshCw,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
    label: 'Changed',
  },
  Fixed: {
    icon: Settings,
    color: 'text-purple-500 dark:text-purple-400',
    bgColor: 'bg-purple-500/10 dark:bg-purple-500/20',
    label: 'Fixed',
  },
  Removed: {
    icon: Trash,
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-500/10 dark:bg-red-500/20',
    label: 'Removed',
  },
  Deprecated: {
    icon: AlertTriangle,
    color: 'text-yellow-500 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    label: 'Deprecated',
  },
  Security: {
    icon: Shield,
    color: 'text-orange-500 dark:text-orange-400',
    bgColor: 'bg-orange-500/10 dark:bg-orange-500/20',
    label: 'Security',
  },
};

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
 * Renders a single change item with proper formatting
 */
function ChangeItem({ content }: { content: string }) {
  // Handle both string content and object with content property
  const text = typeof content === 'string' ? content : (content as { content?: string })?.content || '';

  return (
    <li className={`${marginBottom.compact} pl-6 relative`}>
      <span className="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      <span className={muted.default}>{text}</span>
    </li>
  );
}

/**
 * Renders a category section with icon, header, and items
 */
function CategorySection({
  category,
  items,
}: {
  category: ChangelogCategory;
  items: Array<{ content: string } | string>;
}) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  if (!items || items.length === 0) return null;

  return (
    <section className={`${marginBottom.comfortable} ${spaceY.compact}`}>
      {/* Category Header */}
      <div className={`${gap.compact} ${padding.yCompact} flex items-center`}>
        <div
          className={`${radius.md} ${padding.micro} ${config.bgColor} flex items-center justify-center`}
        >
          <Icon className={`${iconSize.sm} ${config.color}`} />
        </div>
        <h3 className={`${weight.semibold} ${size.lg} ${config.color}`}>{config.label}</h3>
        <span className={`${muted.sm} ${size.sm}`}>({items.length})</span>
      </div>

      {/* Change Items */}
      <ul className={`${spaceY.tight} ${marginTop.compact} list-none`}>
        {items.map((item, index) => (
          <ChangeItem
            key={index}
            content={typeof item === 'string' ? item : item.content || ''}
          />
        ))}
      </ul>
    </section>
  );
}

/**
 * ChangelogContent Component
 *
 * Beautifully renders changelog entries with structured changes data.
 * Groups changes by category with icons, proper spacing, and visual hierarchy.
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
    nonEmptyCategories.push('Added');
  if (changes.Changed && changes.Changed.length > 0)
    nonEmptyCategories.push('Changed');
  if (changes.Deprecated && changes.Deprecated.length > 0)
    nonEmptyCategories.push('Deprecated');
  if (changes.Removed && changes.Removed.length > 0)
    nonEmptyCategories.push('Removed');
  if (changes.Fixed && changes.Fixed.length > 0)
    nonEmptyCategories.push('Fixed');
  if (changes.Security && changes.Security.length > 0)
    nonEmptyCategories.push('Security');

  // Check if we have structured changes data to render
  const hasStructuredChanges = nonEmptyCategories.length > 0;

  // Category order for consistent display
  const categoryOrder: ChangelogCategory[] = [
    'Security',
    'Added',
    'Changed',
    'Fixed',
    'Deprecated',
    'Removed',
  ];

  return (
    <article className={`${maxWidth.none} ${spaceY.relaxed}`}>
      {/* Category Badges */}
      {nonEmptyCategories.length > 0 && (
        <div className={`flex flex-wrap ${gap.compact} ${padding.yCompact} ${marginBottom.comfortable}`}>
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

      {/* Main Content */}
      {hasStructuredChanges ? (
        // Render structured changes by category
        <div className={`${spaceY.comfortable} ${border.default} ${radius.lg} ${padding.comfortable}`}>
          {categoryOrder.map((category) => {
            const items = changes[category];
            if (!items || items.length === 0) return null;
            return <CategorySection key={category} category={category} items={items} />;
          })}
        </div>
      ) : metadataSections && metadataSections.length > 0 ? (
        // Fallback to JSON sections if available
        <div className={`prose prose-slate dark:prose-invert ${maxWidth.none}`}>
          <JSONSectionRenderer sections={metadataSections} />
        </div>
      ) : (
        // Final fallback to raw content
        <div className={`prose prose-slate dark:prose-invert ${maxWidth.none}`}>
          <TrustedHTML html={entry.content} />
        </div>
      )}
    </article>
  );
});

ChangelogContent.displayName = 'ChangelogContent';
