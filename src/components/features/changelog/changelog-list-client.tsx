/**
 * Changelog list with database-first filtering via get_changelog_with_category_stats RPC.
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { BaseCard } from '@/src/components/core/domain/cards/content-card-base';
import { CategoryFilter } from '@/src/components/features/changelog/changelog-category-filter';
import { Tabs, TabsContent } from '@/src/components/primitives/ui/tabs';
import {
  formatChangelogDateShort,
  getNonEmptyCategories,
  getRelativeTime,
} from '@/src/lib/changelog/utils';
import { ArrowRight, Calendar } from '@/src/lib/icons';
import { BADGE_COLORS, UI_CLASSES } from '@/src/lib/ui-constants';
import { sanitizeSlug } from '@/src/lib/utils/content.utils';
import type { Tables } from '@/src/types/database.types';
import type { ChangelogCategory } from '@/src/types/database-overrides';

type ChangelogEntry = Tables<'changelog'>;

/**
 * Validate changelog slug is safe for use in URLs
 * Changelog slugs must be 3-100 lowercase characters (letters, numbers, hyphens only)
 */
function isValidChangelogSlug(slug: string): boolean {
  if (typeof slug !== 'string' || slug.length < 3 || slug.length > 100) return false;
  // Strict pattern: lowercase letters, numbers, hyphens only
  return /^[a-z0-9-]+$/.test(slug);
}

/**
 * Validate internal navigation path is safe
 * Only allows relative paths starting with /, no protocol-relative URLs
 */
function isValidInternalPath(path: string): boolean {
  if (typeof path !== 'string' || path.length === 0) return false;
  // Must start with / for relative paths
  if (!path.startsWith('/')) return false;
  // Reject protocol-relative URLs (//example.com)
  if (path.startsWith('//')) return false;
  // Reject dangerous protocols
  if (/^(javascript|data|vbscript|file):/i.test(path)) return false;
  // Basic path validation - allow alphanumeric, slashes, hyphens, underscores
  // This is permissive but safe for Next.js routing
  return /^\/[a-zA-Z0-9/?#\-_.~!*'();:@&=+$,%[\]]*$/.test(path);
}

/**
 * Get safe changelog path from slug
 * Returns null if slug is invalid or unsafe
 */
function getSafeChangelogPath(slug: string | null | undefined): string | null {
  if (!slug || typeof slug !== 'string') return null;
  // Validate slug format
  if (!isValidChangelogSlug(slug)) return null;
  // Sanitize to remove any potentially dangerous characters
  const sanitized = sanitizeSlug(slug).toLowerCase();
  // Double-check after sanitization
  if (!isValidChangelogSlug(sanitized) || sanitized.length === 0) return null;
  // Construct the URL
  const url = `/changelog/${sanitized}`;
  // Validate the final URL path to ensure it's safe
  if (!isValidInternalPath(url)) return null;
  return url;
}

export interface ChangelogListClientProps {
  entries: ChangelogEntry[];
  categoryCounts: Record<string, number>;
}
export function ChangelogListClient({ entries, categoryCounts }: ChangelogListClientProps) {
  const [activeCategory, setActiveCategory] = useState<'All' | ChangelogCategory>('All');

  // Filter entries based on active category
  const filteredEntries =
    activeCategory === 'All'
      ? entries
      : entries.filter((entry) => {
          if (!entry.changes || typeof entry.changes !== 'object') return false;
          const changes = entry.changes as Record<string, unknown>;
          const categoryChanges = changes[activeCategory];
          return Array.isArray(categoryChanges) && categoryChanges.length > 0;
        });

  return (
    <Tabs
      value={activeCategory}
      onValueChange={(value) => setActiveCategory(value as 'All' | ChangelogCategory)}
      className="space-y-6"
    >
      <CategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categoryCounts={categoryCounts}
      />

      <TabsContent value={activeCategory} className="mt-6">
        {filteredEntries.length === 0 ? (
          <output className="flex items-center justify-center py-12" aria-live="polite">
            <p className="text-lg text-muted-foreground">
              No changelog entries found for {activeCategory.toLowerCase()} category.
            </p>
          </output>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredEntries.map((entry) => {
              // Validate and sanitize slug before using in URL
              const targetPath = getSafeChangelogPath(entry.slug);
              // Don't render if slug is invalid or unsafe
              if (!targetPath) return null;
              // Explicit validation at point of use to satisfy static analysis
              // This ensures the URL is a safe internal path before using in Link
              // Type guard: after this check, targetPath is guaranteed to be a valid internal path
              if (!isValidInternalPath(targetPath)) return null;
              // At this point, targetPath is validated and safe for use in Next.js Link
              // Use validated URL directly to satisfy static analysis
              const validatedPath: string = targetPath;
              const nonEmptyCategories = getNonEmptyCategories(entry.changes);
              const displayDate = getRelativeTime(entry.release_date);

              return (
                <Link key={entry.slug} href={validatedPath} className="block">
                  <BaseCard
                    variant="changelog"
                    targetPath={validatedPath}
                    displayTitle={entry.title}
                    {...(entry.tldr && { description: entry.tldr })}
                    ariaLabel={`${entry.title} - ${entry.release_date}`}
                    showAuthor={false}
                    className="transition-all duration-200"
                    renderTopBadges={() => (
                      <div className={'flex items-center gap-2'}>
                        <Calendar className={`${UI_CLASSES.ICON_SM} text-muted-foreground`} />
                        <time
                          dateTime={entry.release_date}
                          className="font-medium text-muted-foreground text-sm"
                          title={formatChangelogDateShort(entry.release_date)}
                        >
                          {displayDate}
                        </time>
                      </div>
                    )}
                    renderContent={() =>
                      nonEmptyCategories.length > 0 ? (
                        <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2}`}>
                          {nonEmptyCategories.slice(0, 4).map((category) => (
                            <UnifiedBadge
                              key={category}
                              variant="base"
                              style="outline"
                              className={`${BADGE_COLORS.changelogCategory[category as keyof typeof BADGE_COLORS.changelogCategory]} font-medium`}
                            >
                              {category}
                            </UnifiedBadge>
                          ))}
                          {nonEmptyCategories.length > 4 && (
                            <UnifiedBadge
                              variant="base"
                              style="outline"
                              className="text-muted-foreground"
                            >
                              +{nonEmptyCategories.length - 4} more
                            </UnifiedBadge>
                          )}
                        </div>
                      ) : null
                    }
                    customMetadataText={
                      <div
                        className={
                          'flex items-center gap-2 font-medium text-primary text-sm transition-colors transition-colors-smooth group-hover:text-accent'
                        }
                      >
                        <span>Read full changelog</span>
                        <ArrowRight className={UI_CLASSES.ICON_SM} />
                      </div>
                    }
                  />
                </Link>
              );
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
