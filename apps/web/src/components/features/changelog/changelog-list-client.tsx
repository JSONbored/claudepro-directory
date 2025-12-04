'use client';

import type { Database } from '@heyclaude/database-types';
import { ChangelogTimelineView } from '@/src/components/features/changelog/changelog-timeline-view';

type ChangelogEntry = Database['public']['Tables']['changelog']['Row'];

export interface ChangelogListClientProps {
  entries: ChangelogEntry[];
  categoryCounts: Record<string, number>;
}

/**
 * ChangelogListClient Component
 * 
 * Timeline view without filter tabs - matches Supabase/Cursor.sh design
 * All entries are displayed in a clean timeline layout
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
