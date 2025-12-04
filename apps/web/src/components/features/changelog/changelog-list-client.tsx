'use client';

import type { Database } from '@heyclaude/database-types';
import { ChangelogTimelineView } from '@/src/components/features/changelog/changelog-timeline-view';

type ChangelogEntry = Database['public']['Tables']['changelog']['Row'];

export interface ChangelogListClientProps {
  entries: ChangelogEntry[];
  categoryCounts: Record<string, number>;
}

/**
 * Render a timeline of changelog entries without filter tabs.
 *
 * Renders the full timeline using ChangelogTimelineView when entries are present; when `entries` is empty, displays a centered "No changelog entries found." message.
 *
 * @param entries - Array of changelog entries to display in the timeline
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