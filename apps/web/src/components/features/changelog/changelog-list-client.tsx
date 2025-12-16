'use client';

import type { changelogModel } from '@heyclaude/data-layer/prisma';

import { ChangelogTimelineView } from '@/src/components/features/changelog/changelog-timeline-view';
import { paddingY, size } from "@heyclaude/web-runtime/design-system";

type ChangelogEntry = changelogModel;

export interface ChangelogListClientProps {
  categoryCounts: Record<string, number>;
  entries: ChangelogEntry[];
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
    <div className={`w-full`}>
      {entries.length === 0 ? (
        <output className={`flex items-center justify-center ${paddingY.section}`} aria-live="polite">
          <p className={`text-muted-foreground ${size.lg}`}>No changelog entries found.</p>
        </output>
      ) : (
        <ChangelogTimelineView entries={entries} />
      )}
    </div>
  );
}
