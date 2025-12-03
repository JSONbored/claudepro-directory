/**
 * Changelog Content Component
 *
 * Renders full changelog entry content from structured changes data.
 * Displays categorized changes with beautiful formatting.
 *
 * Architecture:
 * - Uses structured `changes` JSONB field directly
 * - Displays categorized changes sections with icons
 * - Server component (no client-side JS)
 *
 * Production Standards:
 * - Type-safe props
 * - Semantic HTML structure
 * - Accessible headings hierarchy
 * - Optimized for SEO
 * - Uses design system utilities
 */

import type { Database } from '@heyclaude/database-types';
import { type ChangelogChanges, parseChangelogChanges } from '@heyclaude/web-runtime/data';
import {
  bgColor,
  border,
  changelogBadge,
  cluster,
  flexWrap,
  gap,
  iconSize,
  marginBottom,
  maxWidth,
  muted,
  padding,
  radius,
  size,
  spaceY,
  textColor,
  weight,
} from '@heyclaude/web-runtime/design-system';
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Trash,
} from '@heyclaude/web-runtime/icons';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { memo } from 'react';

type ChangelogEntry = Database['public']['Tables']['changelog']['Row'];
type ChangelogCategory = Database['public']['Enums']['changelog_category'];

/**
 * Category configuration with icons, colors, and labels
 */
const CATEGORY_CONFIG: Record<
  ChangelogCategory,
  {
    icon: typeof Plus;
    textColor: string;
    bgColor: string;
    borderColor: string;
    label: string;
    description: string;
  }
> = {
  Added: {
    icon: Plus,
    textColor: textColor.emerald,
    bgColor: bgColor.success,
    borderColor: 'border-emerald-500/20',
    label: 'Added',
    description: 'New features and additions',
  },
  Changed: {
    icon: RefreshCw,
    textColor: textColor.blue,
    bgColor: bgColor.info,
    borderColor: 'border-blue-500/20',
    label: 'Changed',
    description: 'Updates and improvements',
  },
  Fixed: {
    icon: Settings,
    textColor: textColor.purple500,
    bgColor: bgColor['purple/10'],
    borderColor: 'border-purple-500/20',
    label: 'Fixed',
    description: 'Bug fixes and corrections',
  },
  Removed: {
    icon: Trash,
    textColor: textColor.red,
    bgColor: bgColor.error,
    borderColor: 'border-red-500/20',
    label: 'Removed',
    description: 'Removed features and deprecations',
  },
  Deprecated: {
    icon: AlertTriangle,
    textColor: textColor.amber,
    bgColor: bgColor.warning,
    borderColor: 'border-amber-500/20',
    label: 'Deprecated',
    description: 'Features marked for future removal',
  },
  Security: {
    icon: Shield,
    textColor: textColor.orange,
    bgColor: bgColor['orange/10'],
    borderColor: 'border-orange-500/20',
    label: 'Security',
    description: 'Security updates and patches',
  },
};

/**
 * Canonical order for displaying changelog categories
 * Follows Keep a Changelog convention
 */
const CATEGORY_ORDER: ChangelogCategory[] = [
  'Added',
  'Changed',
  'Fixed',
  'Deprecated',
  'Removed',
  'Security',
];

/**
 * Props for ChangelogContent component
 */
export interface ChangelogContentProps {
  /** Changelog entry to render */
  entry: ChangelogEntry;
}

/**
 * Render a single category section with its changes
 */
function CategorySection({
  category,
  items,
}: {
  category: ChangelogCategory;
  items: string[];
}) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  if (items.length === 0) return null;

  return (
    <section className={`${radius.lg} ${border.default} ${config.borderColor} ${padding.comfortable}`}>
      {/* Category Header */}
      <div className={`${cluster.default} ${marginBottom.default}`}>
        <div
          className={`${radius.md} ${padding.compact} ${config.bgColor}`}
        >
          <Icon className={`${iconSize.md} ${config.textColor}`} />
        </div>
        <div>
          <h3 className={`${weight.semibold} ${size.lg}`}>{config.label}</h3>
          <p className={muted.sm}>{config.description}</p>
        </div>
      </div>

      {/* Changes List */}
      <ul className={`${spaceY.compact} list-none`}>
        {items.map((item, index) => (
          <li
            key={`${category}-${index}`}
            className={`${cluster.compact} ${padding.yTight}`}
          >
            <span
              className={`${radius.full} h-1.5 w-1.5 shrink-0 ${config.bgColor.replace('/10', '/50')}`}
              aria-hidden="true"
            />
            <span className={size.base}>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Get non-empty categories from changes object in canonical order
 */
function getNonEmptyCategories(
  changes: ChangelogChanges
): { category: ChangelogCategory; items: string[] }[] {
  return CATEGORY_ORDER.filter(
    (category) => changes[category] && changes[category]!.length > 0
  ).map((category) => ({
    category,
    items: changes[category] ?? [],
  }));
}

/**
 * ChangelogContent Component
 *
 * Renders changelog entry content from structured changes data.
 * Displays each category section with icon, heading, and list of changes.
 *
 * @example
 * ```tsx
 * <ChangelogContent entry={changelogEntry} />
 * ```
 */
export const ChangelogContent = memo(({ entry }: ChangelogContentProps) => {
  // Parse changes JSONB field with type safety
  const changes = parseChangelogChanges(entry.changes);

  // Get non-empty categories in canonical order
  const nonEmptyCategories = getNonEmptyCategories(changes);

  // If no changes, show a fallback message
  if (nonEmptyCategories.length === 0) {
    return (
      <article className={`${maxWidth.none} ${spaceY.relaxed}`}>
        <div className={`${radius.lg} ${border.default} ${padding.comfortable} ${muted.default}`}>
          <p>No detailed changes recorded for this release.</p>
        </div>
      </article>
    );
  }

  return (
    <article className={`${maxWidth.none} ${spaceY.relaxed}`}>
      {/* Category Badges Summary */}
      <div className={`flex ${flexWrap.wrap} ${gap.compact} ${padding.yCompact}`}>
        {nonEmptyCategories.map(({ category, items }) => (
          <UnifiedBadge
            key={category}
            variant="base"
            style="outline"
            className={`${changelogBadge[category]} ${weight.medium}`}
          >
            {category} ({items.length})
          </UnifiedBadge>
        ))}
      </div>

      {/* Category Sections */}
      <div className={spaceY.comfortable}>
        {nonEmptyCategories.map(({ category, items }) => (
          <CategorySection key={category} category={category} items={items} />
        ))}
      </div>

      {/* TL;DR if available */}
      {entry.tldr && (
        <div className={`${radius.lg} ${bgColor['accent/5']} ${border.default} border-accent/20 ${padding.comfortable}`}>
          <h3 className={`${weight.semibold} ${size.base} ${marginBottom.tight}`}>
            TL;DR
          </h3>
          <p className={muted.default}>{entry.tldr}</p>
        </div>
      )}
    </article>
  );
});

ChangelogContent.displayName = 'ChangelogContent';
