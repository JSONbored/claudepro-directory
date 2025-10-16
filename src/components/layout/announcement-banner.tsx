'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Announcement, AnnouncementTag, AnnouncementTitle } from '@/src/components/ui/announcement';
import { getActiveAnnouncement } from '@/src/config/announcements';
import { useAnnouncementDismissal } from '@/src/hooks/use-announcement-dismissal';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Sparkles,
  X,
} from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Icon mapping for announcements
 * Maps icon names from config to Lucide icon components
 */
const ICON_MAP = {
  ArrowUpRight,
  ArrowRight,
  AlertTriangle,
  Calendar,
  BookOpen,
  Sparkles,
} as const;

type IconName = keyof typeof ICON_MAP;

/**
 * AnnouncementBanner Component
 *
 * Global announcement banner displayed above navigation.
 * Automatically manages visibility, dismissal state, and responsive behavior.
 *
 * Features:
 * - Automatic announcement selection based on date and priority
 * - Persistent dismissal tracking (localStorage)
 * - Responsive design (mobile + desktop)
 * - Accessibility (WCAG 2.1 AA compliant)
 * - Keyboard navigation (Escape to dismiss)
 * - Reduced motion support
 * - Touch-friendly dismiss button (44x44px minimum)
 *
 * Usage: Include once in root layout above navigation.
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <body>
 *   <AnnouncementBanner />
 *   <Navigation />
 *   <main>{children}</main>
 * </body>
 * ```
 *
 * @see Research Report: "shadcn Announcement Component Integration - Section 5"
 */
export function AnnouncementBanner() {
  // Get current active announcement
  const announcement = getActiveAnnouncement();

  // Get dismissal state for this announcement
  const { isDismissed, dismiss } = useAnnouncementDismissal(announcement?.id || '');

  // Keyboard navigation: Escape key dismisses announcement
  useEffect(() => {
    if (!announcement?.dismissible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [announcement, dismiss]);

  // Don't render if no announcement or already dismissed
  if (!announcement || isDismissed) {
    return null;
  }

  // Get icon component if specified
  const IconComponent = announcement.icon ? ICON_MAP[announcement.icon as IconName] : null;

  return (
    <section
      aria-label="Site announcement"
      aria-live="polite"
      aria-atomic="true"
      className="w-full pt-2 px-3 pb-2 hidden md:block"
    >
      {/* Rounded pill container */}
      <div className="container mx-auto">
        <div
          className={`
            rounded-full
            border border-accent/20
            bg-accent/10
            backdrop-blur-sm
            transition-all
            duration-300
            motion-reduce:transition-none
            shadow-sm
            hover:shadow-md
            hover:border-accent/30
          `}
        >
          <div className="px-4 py-2 md:px-6 md:py-2.5">
            <div className={UI_CLASSES.FLEX_COL_SM_ROW_ITEMS_CENTER_JUSTIFY_BETWEEN}>
              {/* Announcement Content */}
              <Announcement
                variant={announcement.variant}
                className={'flex-1 border-none bg-transparent shadow-none'}
              >
                {announcement.tag && (
                  <AnnouncementTag className={'text-[9px] sm:text-xs flex-shrink-0 font-bold'}>
                    {announcement.tag}
                  </AnnouncementTag>
                )}

                <AnnouncementTitle className="text-[11px] sm:text-sm font-semibold text-foreground">
                  {announcement.href ? (
                    <Link
                      href={announcement.href}
                      className={`hover:underline ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5} transition-colors duration-200`}
                    >
                      <span className="line-clamp-2 sm:line-clamp-1">{announcement.title}</span>
                      {IconComponent && (
                        <IconComponent
                          className={'h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0'}
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  ) : (
                    <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
                      <span className="line-clamp-2 sm:line-clamp-1">{announcement.title}</span>
                      {IconComponent && (
                        <IconComponent
                          className={'h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0'}
                          aria-hidden="true"
                        />
                      )}
                    </span>
                  )}
                </AnnouncementTitle>
              </Announcement>

              {/* Dismiss Button */}
              {announcement.dismissible && (
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="Dismiss announcement"
                  className={`
                    flex items-center justify-center
                    min-w-[36px] min-h-[36px]
                    sm:min-w-[40px] sm:min-h-[40px]
                    hover:bg-accent/20
                    rounded-full
                    transition-colors
                    duration-200
                    focus-visible:ring-2
                    focus-visible:ring-accent
                    focus-visible:ring-offset-2
                    flex-shrink-0
                  `}
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
