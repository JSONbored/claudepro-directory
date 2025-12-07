/**
 * Timeline Marker Component
 *
 * Individual timeline entry marker with sticky positioning.
 * Stacks as user scrolls through content sections.
 */

'use client';

import { type Database } from '@heyclaude/database-types';
import { ANIMATION_CONSTANTS } from '@heyclaude/web-runtime/ui';
import { formatChangelogDateShort } from '@heyclaude/web-runtime/utils/changelog';
import Link from 'next/link';

interface TimelineMarkerProps {
  entry: Database['public']['Tables']['changelog']['Row'];
  isActive: boolean;
  onClick?: (() => void) | undefined;
  targetPath: string;
}

// Sticky offset accounts for fixed header (64px) + padding (32px)
// This matches the scroll-mt-24 on entry headers for proper alignment
const TIMELINE_MARKER_STICKY_OFFSET = '96px';

/**
 * Render a sticky timeline entry with a marker, connector, and link to a changelog item.
 *
 * Matches Supabase changelog timeline pattern:
 * - Sticky positioning that stacks as you scroll
 * - Marker aligns exactly with entry header h2 title
 * - Connects to vertical timeline line
 * - Stays sticky until next entry scrolls into view
 *
 * @param entry - A changelog row from the public database schema used to render title and release date
 * @param isActive - Controls visual emphasis (z-index, text styles, and marker color) when the related content section is active
 * @param targetPath - Destination URL the marker links to
 * @param onClick - Optional click handler invoked when the link is activated
 * @returns A JSX element representing the timeline marker for the provided changelog entry
 *
 * @see formatChangelogDateShort
 * @see TIMELINE_MARKER_STICKY_OFFSET
 */
export function TimelineMarker({ entry, isActive, targetPath, onClick }: TimelineMarkerProps) {
  return (
    <div
      className={`relative ${isActive ? 'z-20' : 'z-10'}`}
      style={{ position: 'sticky', top: TIMELINE_MARKER_STICKY_OFFSET }}
    >
      {/* Horizontal connector line from marker dot to timeline - Brighter, more visible */}
      {/* Aligned with h2 title baseline (text-3xl ~30px, so baseline at ~28px) */}
      <div className="bg-primary/60 absolute top-[28px] -left-5 h-px w-5" aria-hidden="true" />

      {/* Marker dot - Brighter, more visible, aligned with entry header h2 title baseline */}
      <div
        className={`absolute top-[24px] -left-[21px] h-3 w-3 rounded-full transition-all ${
          isActive ? 'bg-primary ring-2 ring-primary/30 shadow-sm' : 'bg-primary/50'
        }`}
        aria-hidden="true"
      />

      {/* Marker content - Title and date aligned to match entry header exactly */}
      {/* Structure matches entry header: h2 (title) at top, then date below */}
      <Link
        href={targetPath}
        {...(onClick && { onClick })}
        className={`group block ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} ${
          isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'
        }`}
      >
        {/* Title and date - Matches entry header structure exactly (h2 + date with mb-3 spacing) */}
        <div className="flex min-w-0 flex-col">
          <h3
            className={`text-base leading-tight mb-3 ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground font-normal'} group-hover:text-foreground ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} line-clamp-2`}
          >
            {entry.title}
          </h3>
          <time
            dateTime={entry.release_date}
            className={`text-xs leading-tight text-muted-foreground ${isActive ? 'opacity-100' : 'opacity-60'}`}
          >
            {formatChangelogDateShort(entry.release_date)}
          </time>
        </div>
      </Link>
    </div>
  );
}
