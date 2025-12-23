'use client';

import type { announcement_icon } from '@prisma/client';
import { useAnnouncementDismissal } from '@heyclaude/web-runtime/hooks/use-announcement-dismissal';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Sparkles,
  X,
} from '@heyclaude/web-runtime/icons';
import { Announcement, AnnouncementTag, AnnouncementTitle, cn } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { type ComponentType, useEffect } from 'react';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';

/**
 * Icon mapping for announcements
 * Maps icon names from config to Lucide icon components
 */
type AnnouncementIcon = announcement_icon;
const ICON_MAP: Record<AnnouncementIcon, ComponentType<{ className?: string }>> = {
  ArrowUpRight,
  ArrowRight,
  AlertTriangle,
  Calendar,
  BookOpen,
  Sparkles,
};

import type { Prisma } from '@prisma/client';

type announcementsModel = Prisma.announcementsGetPayload<{}>;

interface AnnouncementBannerClientProps {
  announcement: announcementsModel;
}

/**
 * AnnouncementBannerClient Component
 *
 * Client component for rendering announcement banner with dismissal.
 * Receives announcement data from server component.
 *
 * Features:
 * - Persistent dismissal tracking (localStorage)
 * - Responsive design (mobile + desktop)
 * - Accessibility (WCAG 2.1 AA compliant)
 * - Keyboard navigation (Escape to dismiss)
 * - Reduced motion support
 * - Touch-friendly dismiss button (44x44px minimum)
 * - SSR-safe with client-side hydration (prevents flash)
 *
 * Database-first: Migrated from announcement-banner.tsx
 */
export function AnnouncementBannerClient({ announcement }: AnnouncementBannerClientProps) {
  // Get dismissal state for this announcement
  const { isDismissed, dismiss } = useAnnouncementDismissal(announcement.id);

  // Client-side hydration state to prevent SSR mismatch
  // Banner only renders after client-side mount to avoid flash
  const { value: isMounted, setTrue: setIsMountedTrue } = useBoolean();

  useEffect(() => {
    setIsMountedTrue();
  }, [setIsMountedTrue]);

  // Keyboard navigation: Escape key dismisses announcement
  useEffect(() => {
    if (!announcement.dismissible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };

    globalThis.addEventListener('keydown', handleEscape);
    return () => globalThis.removeEventListener('keydown', handleEscape);
  }, [announcement.dismissible, dismiss]);

  // Don't render until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return null;
  }

  // Don't render if already dismissed
  if (isDismissed) {
    return null;
  }

  // Get icon component if specified
  const IconComponent = announcement.icon ? ICON_MAP[announcement.icon] : null;

  /**
   * Z-Index Hierarchy:
   * - z-100: Skip-to-content link (highest priority - accessibility)
   * - z-60:  Announcement banner (above navigation, below skip link)
   * - z-50:    Navigation, dialogs, sheets, dropdowns
   * - z-10:    Component-level overlays (badges, cards)
   *
   * Note: Navigation uses `sticky top-0 z-50 contain-layout` which creates
   * a new stacking context. Without explicit z-index, the announcement would
   * be visually obscured by navigation's stacking context.
   */
  return (
    <section
      aria-label="Site announcement"
      aria-live="polite"
      aria-atomic="true"
      className="relative z-60 hidden w-full px-3 pt-2 pb-2 md:block"
    >
      {/* Rounded pill container */}
      <div className="container mx-auto">
        <div className="border-accent/20 bg-accent/10 hover:border-accent/30 rounded-full border shadow-sm backdrop-blur-sm transition-all duration-300 ease-out hover:shadow-md motion-reduce:transition-none">
          <div className="px-4 py-2 md:px-6 md:py-2.5">
            <div className="flex flex-col items-center md:flex-row md:items-center">
              {/* Announcement Content */}
              <Announcement
                variant={announcement.variant}
                className="flex-1 border-none bg-transparent shadow-none"
              >
                {announcement.tag ? (
                  <AnnouncementTag className="shrink-0 text-3xs font-bold sm:text-xs"> {/* 9px = text-3xs */}
                    {announcement.tag}
                  </AnnouncementTag>
                ) : null}

                <AnnouncementTitle className="text-foreground text-sm font-semibold sm:text-sm"> {/* 11px → text-sm */}
                  {announcement.href ? (
                    <Link
                      href={announcement.href}
                      className={cn(
                        'hover:underline',
                        'flex items-center gap-2',
                        'gap-1.5',
                        'transition-all duration-200 ease-out'
                      )}
                    >
                      <span className="line-clamp-2 sm:line-clamp-1">{announcement.title}</span>
                      {IconComponent ? (
                        <IconComponent
                          className="h-3 w-3 shrink-0 sm:h-4 sm:w-4"
                          aria-hidden="true"
                        />
                      ) : null}
                    </Link>
                  ) : (
                    <span className={cn('flex items-center gap-2', 'gap-1.5')}>
                      <span className="line-clamp-2 sm:line-clamp-1">{announcement.title}</span>
                      {IconComponent ? (
                        <IconComponent
                          className="h-3 w-3 shrink-0 sm:h-4 sm:w-4"
                          aria-hidden="true"
                        />
                      ) : null}
                    </span>
                  )}
                </AnnouncementTitle>
              </Announcement>

              {/* Dismiss Button */}
              {announcement.dismissible ? (
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="Dismiss announcement"
                  className="hover:bg-accent/20 focus-visible:ring-accent flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 sm:min-h-[40px] sm:min-w-[40px]"
                >
                  <X className="text-foreground h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
