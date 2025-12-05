'use client';

import type { Database } from '@heyclaude/database-types';
import { ChangelogTimelineView } from '@/src/components/features/changelog/changelog-timeline-view';

type ChangelogEntry = Database['public']['Tables']['changelog']['Row'];

export interface ChangelogListClientProps {
  entries: ChangelogEntry[];
  categoryCounts: Record<string, number>;
}

/**
 * Renders a changelog timeline without filter tabs.
 *
 * When `entries` is empty, displays a centered "No changelog entries found." message; otherwise renders the full timeline via ChangelogTimelineView.
 *
 * @param entries - Changelog entries to display
 *
 * @see ChangelogTimelineView
 */
export function ChangelogListClient({ entries }: ChangelogListClientProps) {
  return (
    <div className="w-full">
      {entries.length === 0 ? (
        <output className="flex items-center justify-center py-12" aria-live="polite">
          <p className="text-lg text-muted-foreground">No changelog entries found.</p>
        </output>
      ) : (
        <ChangelogTimelineView entries={entries} />
      )}
    </div>
  );
}