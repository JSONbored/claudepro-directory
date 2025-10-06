/**
 * Changelog Card Component
 *
 * Display component for individual changelog entries in list view.
 * Shows date, title, TL;DR, and category badges with link to detail page.
 *
 * Architecture:
 * - Follows existing ConfigCard patterns
 * - Uses shadcn Card component
 * - Keyboard navigation support
 * - Responsive design
 *
 * Production Standards:
 * - Accessible with ARIA labels
 * - Interactive states (hover, focus, click)
 * - Type-safe props with Zod validation
 * - Memoized for performance
 */

'use client';

import Link from 'next/link';
import { memo } from 'react';
import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import {
  formatChangelogDateShort,
  getChangelogPath,
  getNonEmptyCategories,
  getRelativeTime,
} from '@/src/lib/changelog/utils';
import { ArrowRight, Calendar } from '@/src/lib/icons';
import type { ChangelogEntry } from '@/src/lib/schemas/changelog.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Props for ChangelogCard component
 */
export interface ChangelogCardProps {
  /** Changelog entry data */
  entry: ChangelogEntry;
  /** Show full date or relative time (default: relative) */
  dateFormat?: 'full' | 'relative';
  /** Show category badges (default: true) */
  showCategories?: boolean;
}

/**
 * Category badge color mapping
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
 * ChangelogCard Component
 *
 * @example
 * ```tsx
 * <ChangelogCard
 *   entry={changelogEntry}
 *   dateFormat="relative"
 *   showCategories={true}
 * />
 * ```
 */
export const ChangelogCard = memo(
  ({ entry, dateFormat = 'relative', showCategories = true }: ChangelogCardProps) => {
    const targetPath = getChangelogPath(entry.slug);
    const nonEmptyCategories = getNonEmptyCategories(entry.categories);

    return (
      <Link href={targetPath} className="block">
        <Card
          className={`${UI_CLASSES.CARD_INTERACTIVE} transition-all duration-200`}
          role="article"
          aria-label={`${entry.title} - ${entry.date}`}
        >
          <CardHeader className="pb-3">
            {/* Date */}
            <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-2 mb-2`}>
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <time
                dateTime={entry.date}
                className="text-sm font-medium text-muted-foreground"
                title={formatChangelogDateShort(entry.date)}
              >
                {dateFormat === 'relative'
                  ? getRelativeTime(entry.date)
                  : formatChangelogDateShort(entry.date)}
              </time>
            </div>

            {/* Title */}
            <CardTitle
              className={`${UI_CLASSES.TEXT_LG} font-semibold text-foreground ${UI_CLASSES.HOVER_TEXT_ACCENT} transition-colors`}
            >
              {entry.title}
            </CardTitle>

            {/* TL;DR */}
            {entry.tldr && (
              <CardDescription
                className={`text-sm text-muted-foreground mt-2 ${UI_CLASSES.LINE_CLAMP_2}`}
              >
                {entry.tldr}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="pt-0">
            {/* Category Badges */}
            {showCategories && nonEmptyCategories.length > 0 && (
              <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2} mb-3`}>
                {nonEmptyCategories.slice(0, 4).map((category) => (
                  <Badge
                    key={category}
                    variant="outline"
                    className={`${CATEGORY_COLORS[category]} font-medium`}
                  >
                    {category}
                  </Badge>
                ))}
                {nonEmptyCategories.length > 4 && (
                  <Badge variant="outline" className="text-muted-foreground">
                    +{nonEmptyCategories.length - 4} more
                  </Badge>
                )}
              </div>
            )}

            {/* Read More Link */}
            <div
              className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-2 text-sm text-primary ${UI_CLASSES.HOVER_TEXT_ACCENT} font-medium transition-colors`}
            >
              <span>Read full changelog</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }
);

ChangelogCard.displayName = 'ChangelogCard';
