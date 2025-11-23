'use client';

import type { Database } from '@heyclaude/database-types';
import { ANIMATION_CONSTANTS, DIMENSIONS, UI_CLASSES } from '@heyclaude/web-runtime';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Sparkles,
  X,
} from '@heyclaude/web-runtime/icons';
import Link from 'next/link';
import { type ComponentType, useEffect, useState } from 'react';
import {
  Announcement,
  AnnouncementTag,
  AnnouncementTitle,
} from '@/src/components/primitives/feedback/announcement';
import { useAnnouncementDismissal } from '@/src/hooks/use-announcement-dismissal';

/**
 * Icon mapping for announcements
 * Maps icon names from config to Lucide icon components
 */
type AnnouncementIcon = Database['public']['Enums']['announcement_icon'];
const ICON_MAP: Record<AnnouncementIcon, ComponentType<{ className?: string }>> = {
  ArrowUpRight,
  ArrowRight,
  AlertTriangle,
  Calendar,
  BookOpen,
  Sparkles,
};

interface AnnouncementBannerClientProps {
  announcement: Database['public']['Tables']['announcements']['Row'];
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Keyboard navigation: Escape key dismisses announcement
  useEffect(() => {
    if (!announcement.dismissible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
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
   * - z-[100]: Skip-to-content link (highest priority - accessibility)
   * - z-[60]:  Announcement banner (above navigation, below skip link)
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
        <div
          className={`rounded-full border border-accent/20 bg-accent/10 shadow-sm backdrop-blur-sm ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} hover:border-accent/30 hover:shadow-md motion-reduce:transition-none`}
        >
          <div className="px-4 py-2 md:px-6 md:py-2.5">
            <div className={UI_CLASSES.FLEX_COL_SM_ROW_ITEMS_CENTER_JUSTIFY_BETWEEN}>
              {/* Announcement Content */}
              <Announcement
                variant={announcement.variant}
                className={'flex-1 border-none bg-transparent shadow-none'}
              >
                {announcement.tag && (
                  <AnnouncementTag className={'shrink-0 font-bold text-[9px] sm:text-xs'}>
                    {announcement.tag}
                  </AnnouncementTag>
                )}

                <AnnouncementTitle className="font-semibold text-[11px] text-foreground sm:text-sm">
                  {announcement.href ? (
                    <Link
                      href={announcement.href}
                      className={`hover:underline ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5} ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`}
                    >
                      <span className="line-clamp-2 sm:line-clamp-1">{announcement.title}</span>
                      {IconComponent && (
                        <IconComponent
                          className={'h-3 w-3 shrink-0 sm:h-4 sm:w-4'}
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  ) : (
                    <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
                      <span className="line-clamp-2 sm:line-clamp-1">{announcement.title}</span>
                      {IconComponent && (
                        <IconComponent
                          className={'h-3 w-3 shrink-0 sm:h-4 sm:w-4'}
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
                  className={`flex ${DIMENSIONS.MIN_H_ICON_BUTTON_SM} ${DIMENSIONS.MIN_W_ICON_BUTTON_SM} shrink-0 items-center justify-center rounded-full ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} hover:bg-accent/20 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:${DIMENSIONS.MIN_H_ICON_BUTTON_MD} sm:${DIMENSIONS.MIN_W_ICON_BUTTON_MD}`}
                >
                  <X
                    className={`${UI_CLASSES.ICON_XS} text-foreground sm:h-4 sm:w-4`}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
