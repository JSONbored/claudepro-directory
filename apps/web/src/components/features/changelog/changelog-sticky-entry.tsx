import type { changelogModel } from '@heyclaude/data-layer/prisma';
import { ArrowRight, Calendar } from '@heyclaude/web-runtime/icons';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import {
  formatChangelogDateShort,
  getNonEmptyCategories,
  getRelativeTime,
} from '@heyclaude/web-runtime/utils/changelog';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@heyclaude/web-runtime/ui';
import type { changelog_category } from '@heyclaude/data-layer/prisma';

interface ChangelogStickyEntryProps {
  entry: changelogModel;
  targetPath: string;
}

// Direct Tailwind utilities mapping - no wrapper needed
const changelogBadgeMap: Record<changelog_category, string> = {
  Added: 'bg-color-badge-changelog-added-bg text-color-badge-changelog-added-text-light dark:text-color-badge-changelog-added-text-dark border-color-badge-changelog-added-border',
  Changed: 'bg-color-badge-changelog-changed-bg text-color-badge-changelog-changed-text-light dark:text-color-badge-changelog-changed-text-dark border-color-badge-changelog-changed-border',
  Deprecated: 'bg-color-badge-changelog-deprecated-bg text-color-badge-changelog-deprecated-text-light dark:text-color-badge-changelog-deprecated-text-dark border-color-badge-changelog-deprecated-border',
  Removed: 'bg-color-badge-changelog-removed-bg text-color-badge-changelog-removed-text-light dark:text-color-badge-changelog-removed-text-dark border-color-badge-changelog-removed-border',
  Fixed: 'bg-color-badge-changelog-fixed-bg text-color-badge-changelog-fixed-text-light dark:text-color-badge-changelog-fixed-text-dark border-color-badge-changelog-fixed-border',
  Security: 'bg-color-badge-changelog-security-bg text-color-badge-changelog-security-text-light dark:text-color-badge-changelog-security-text-dark border-color-badge-changelog-security-border',
};

export function ChangelogStickyEntry({ entry, targetPath }: ChangelogStickyEntryProps) {
  const releaseDateString = entry.release_date instanceof Date ? entry.release_date.toISOString() : entry.release_date;
  const displayDate = getRelativeTime(releaseDateString);
  const nonEmptyCategories = getNonEmptyCategories(entry.changes);

  return (
    <div className="group border-muted relative grid gap-6 border-l-2 pl-8 md:grid-cols-[240px_1fr] md:border-l-0 md:pl-4">
      {/* Mobile Date/Title (visible only on small screens) */}
      <div className="md:hidden">
        <div className="text-muted-foreground text-sm mb-2 flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <time dateTime={releaseDateString}>{formatChangelogDateShort(releaseDateString)}</time>
        </div>
        <Link href={targetPath} className="hover:text-primary block text-xl font-bold">
          {entry.title}
        </Link>
      </div>

      {/* Sticky Sidebar (Desktop) */}
      <div className="hidden md:block">
        <div className="sticky top-24 flex flex-col gap-4">
          <div className={cn('flex flex-col', 'gap-1.5')}>
            <div className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime={releaseDateString} className="text-sm-medium">
                {formatChangelogDateShort(releaseDateString)}
              </time>
            </div>
            <span className="text-muted-foreground/70 text-xs">{displayDate}</span>
          </div>

          <Link
            href={targetPath}
            className="hover:text-primary block text-2xl leading-tight font-bold tracking-tight"
          >
            {entry.title}
          </Link>

          {/* Categories in Sidebar for Desktop */}
          {nonEmptyCategories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {nonEmptyCategories.slice(0, 3).map((category) => (
                <UnifiedBadge
                  key={category}
                  variant="base"
                  style="outline"
                      className={`${changelogBadgeMap[category]} text-xs`}
                >
                  {category}
                </UnifiedBadge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Card (Right Side) */}
      <div className="relative flex flex-col gap-3">
        <Link href={targetPath} className="group/card block h-full">
          <div className="border-border/40 bg-card hover:border-primary/20 h-full overflow-hidden rounded-xl border transition-all hover:shadow-lg">
            {/* Hero Image */}
            {entry.og_image ? (
              <div className="border-border/40 bg-muted/50 relative aspect-video w-full border-b">
                <Image
                  src={entry.og_image}
                  alt={entry.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 800px"
                />
              </div>
            ) : null}

            <div className="p-6 md:p-8">
              {/* Mobile Categories (hidden on desktop since they are in sidebar) */}
              {nonEmptyCategories.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1 md:hidden">
                  {nonEmptyCategories.slice(0, 4).map((category) => (
                    <UnifiedBadge
                      key={category}
                      variant="base"
                      style="outline"
                      className={`${changelogBadgeMap[category]} font-medium`}
                    >
                      {category}
                    </UnifiedBadge>
                  ))}
                </div>
              )}

              {/* TLDR / Description */}
              {entry.tldr ? (
                <p className="text-muted-foreground mb-6 text-base leading-relaxed">{entry.tldr}</p>
              ) : null}

              {/* Read More Link */}
              <div className="text-primary group-hover/card:text-accent flex items-center gap-1 text-sm-medium transition-colors">
                <span>Read full changelog</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
