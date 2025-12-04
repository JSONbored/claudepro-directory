/**
 * Timeline Marker Component
 *
 * Individual timeline entry marker with sticky positioning.
 * Stacks as user scrolls through content sections.
 */

'use client';

import type { Database } from '@heyclaude/database-types';
import { ANIMATION_CONSTANTS } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { formatChangelogDateShort } from '@heyclaude/web-runtime/utils/changelog';

interface TimelineMarkerProps {
  entry: Database['public']['Tables']['changelog']['Row'];
  index: number;
  isActive: boolean;
  targetPath: string;
  onClick?: (() => void) | undefined;
}

/**
 * TimelineMarker Component
 * 
 * Sticky timeline entry that highlights when its content section is active
 */
export function TimelineMarker({ entry, isActive, targetPath, onClick }: TimelineMarkerProps) {
  return (
    <div
      className={`relative ${isActive ? 'z-20' : 'z-10'}`}
      style={{ position: 'sticky', top: '96px' }}
    >
      {/* Horizontal connector line from marker dot to timeline - Minimal */}
      <div className="absolute -left-5 top-[18px] h-px w-5 bg-border/40" aria-hidden="true" />
      
      {/* Minimal marker dot */}
      <div
        className={`absolute -left-[21px] top-[14px] h-2 w-2 rounded-full transition-all ${
          isActive
            ? 'bg-primary'
            : 'bg-border/60'
        }`}
        aria-hidden="true"
      />

      {/* Marker content - Minimal design */}
      <Link
        href={targetPath}
        {...(onClick && { onClick })}
        className={`group block py-2 ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} ${
          isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'
        }`}
      >
        {/* Title and date - Minimal, compact */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3
            className={`text-sm leading-snug ${isActive ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground'} group-hover:text-foreground ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} line-clamp-2`}
          >
            {entry.title}
          </h3>
          <time
            dateTime={entry.release_date}
            className={`text-[11px] leading-tight ${isActive ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}
          >
            {formatChangelogDateShort(entry.release_date)}
          </time>
        </div>
      </Link>
    </div>
  );
}
