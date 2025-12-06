import { type Database } from '@heyclaude/database-types';
import { ArrowRight, Calendar } from '@heyclaude/web-runtime/icons';
import { BADGE_COLORS, UnifiedBadge } from '@heyclaude/web-runtime/ui';
import {
  formatChangelogDateShort,
  getNonEmptyCategories,
  getRelativeTime,
} from '@heyclaude/web-runtime/utils/changelog';
import Image from 'next/image';
import Link from 'next/link';

interface ChangelogStickyEntryProps {
  entry: Database['public']['Tables']['changelog']['Row'];
  targetPath: string;
}

export function ChangelogStickyEntry({ entry, targetPath }: ChangelogStickyEntryProps) {
  const displayDate = getRelativeTime(entry.release_date);
  const nonEmptyCategories = getNonEmptyCategories(entry.changes);

  return (
    <div className="group border-muted relative grid gap-8 border-l-2 pl-8 md:grid-cols-[240px_1fr] md:border-l-0 md:pl-0">
      {/* Mobile Date/Title (visible only on small screens) */}
      <div className="md:hidden">
        <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          <time dateTime={entry.release_date}>{formatChangelogDateShort(entry.release_date)}</time>
        </div>
        <Link href={targetPath} className="hover:text-primary block text-xl font-bold">
          {entry.title}
        </Link>
      </div>

      {/* Sticky Sidebar (Desktop) */}
      <div className="hidden md:block">
        <div className="sticky top-24 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={entry.release_date} className="text-sm font-medium">
                {formatChangelogDateShort(entry.release_date)}
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
            <div className="flex flex-wrap gap-2">
              {nonEmptyCategories.slice(0, 3).map((category) => (
                <UnifiedBadge
                  key={category}
                  variant="base"
                  style="outline"
                  className={`${BADGE_COLORS.changelogCategory[category]} text-xs`}
                >
                  {category}
                </UnifiedBadge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Card (Right Side) */}
      <div className="relative flex flex-col gap-4">
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
                <div className="mb-4 flex flex-wrap gap-2 md:hidden">
                  {nonEmptyCategories.slice(0, 4).map((category) => (
                    <UnifiedBadge
                      key={category}
                      variant="base"
                      style="outline"
                      className={`${BADGE_COLORS.changelogCategory[category]} font-medium`}
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
              <div className="text-primary group-hover/card:text-accent flex items-center gap-2 text-sm font-medium transition-colors">
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
