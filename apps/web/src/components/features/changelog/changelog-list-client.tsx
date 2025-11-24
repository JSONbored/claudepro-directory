'use client';

import type { Database } from '@heyclaude/database-types';
import { sanitizeSlug } from '@heyclaude/web-runtime/core';
import { useState } from 'react';
import { CategoryFilter } from '@/src/components/features/changelog/changelog-category-filter';
import { ChangelogStickyEntry } from '@/src/components/features/changelog/changelog-sticky-entry';
import { Tabs, TabsContent } from '@/src/components/primitives/ui/tabs';

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
      onValueChange={(value) =>
        setActiveCategory(value as 'All' | Database['public']['Enums']['changelog_category'])
      }
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
          <div className="space-y-12 md:space-y-20">
            {filteredEntries.map((entry) => {
              const targetPath = getSafeChangelogPath(entry.slug);
              if (!targetPath) return null;
              if (!isValidInternalPath(targetPath)) return null;
              const validatedPath: string = targetPath;

              return (
                <ChangelogStickyEntry key={entry.slug} entry={entry} targetPath={validatedPath} />
              );
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
