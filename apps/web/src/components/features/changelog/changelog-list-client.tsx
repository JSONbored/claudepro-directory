'use client';

/**
 * Changelog List Client Component
 * 
 * Client-side component that handles category filtering and displays
 * changelog entries using the animated timeline design.
 */

import type { Database } from '@heyclaude/database-types';
import { sanitizeSlug } from '@heyclaude/web-runtime/core';
import { spaceY, marginTop, muted  , padding, justify,
  alignItems,
  marginLeft,
} from '@heyclaude/web-runtime/design-system';
import { useState } from 'react';

import { CategoryFilter } from '@/src/components/features/changelog/changelog-category-filter';
import { ChangelogTimeline } from '@/src/components/features/changelog/changelog-timeline';
import { Tabs, TabsContent } from '@heyclaude/web-runtime/ui';

type ChangelogEntry = Database['public']['Tables']['changelog']['Row'];

function isValidChangelogSlug(slug: string): boolean {
  if (typeof slug !== 'string' || slug.length < 3 || slug.length > 100) return false;
  return /^[a-z0-9-]+$/.test(slug);
}

function isValidInternalPath(path: string): boolean {
  if (typeof path !== 'string' || path.length === 0) return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (/^(javascript|data|vbscript|file):/i.test(path)) return false;
  return /^\/[a-zA-Z0-9/?#\-_.~!*'();:@&=+$,%[\]]*$/.test(path);
}

function getSafeChangelogPath(slug: string | null | undefined): string | null {
  if (!slug || typeof slug !== 'string') return null;
  if (!isValidChangelogSlug(slug)) return null;
  const sanitized = sanitizeSlug(slug).toLowerCase();
  if (!isValidChangelogSlug(sanitized) || sanitized.length === 0) return null;
  const url = `/changelog/${sanitized}`;
  if (!isValidInternalPath(url)) return null;
  return url;
}

export interface ChangelogListClientProps {
  entries: ChangelogEntry[];
  categoryCounts: Record<string, number>;
}

export function ChangelogListClient({ entries, categoryCounts }: ChangelogListClientProps) {
  const [activeCategory, setActiveCategory] = useState<
    'All' | Database['public']['Enums']['changelog_category']
  >('All');

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

  // Map to timeline-compatible format with validated paths
  const timelineEntries = filteredEntries
    .filter((entry) => {
      const path = getSafeChangelogPath(entry.slug);
      return path !== null && isValidInternalPath(path);
    })
    .map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      tldr: entry.tldr,
      release_date: entry.release_date,
      changes: entry.changes as Record<string, unknown> | null,
    }));

  // Safe path getter for timeline
  const getTargetPath = (slug: string): string => {
    const path = getSafeChangelogPath(slug);
    return path ?? `/changelog/${slug}`;
  };

  return (
    <Tabs
      value={activeCategory}
      onValueChange={(value) =>
        setActiveCategory(value as 'All' | Database['public']['Enums']['changelog_category'])
      }
      className={spaceY.relaxed}
    >
      <CategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categoryCounts={categoryCounts}
      />

      <TabsContent value={activeCategory} className={marginTop.comfortable}>
        {timelineEntries.length === 0 ? (
          <output className={`flex ${alignItems.center} ${justify.center} ${padding.ySection}`} aria-live="polite">
            <p className={muted.lg}>
              No changelog entries found for {activeCategory.toLowerCase()} category.
            </p>
          </output>
        ) : (
          <ChangelogTimeline
            entries={timelineEntries}
            getTargetPath={getTargetPath}
            className={marginLeft.tight}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
