'use client';

import type { Database } from '@heyclaude/database-types';
import {
  cluster,
  iconSize,
  weight,
  padding,
  zLayer,
  shadow,
  backdrop,
  radius,
  borderColor,
  flexDir,
  bgColor,
  justify,
  textColor,
  alignItems,
  buttonMinHeight,
  buttonMinWidth,
  transition,
  size,
} from '@heyclaude/web-runtime/design-system';
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
} from '@heyclaude/web-runtime/ui';
import { useAnnouncementDismissal } from '@heyclaude/web-runtime/hooks';

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
 * Renders a dismissible announcement banner for a single announcement with persistent dismissal state.
 *
 * @param announcement - Announcement data used to render title, tag, href, icon, variant, and dismissible flag.
 * @returns The announcement banner element when active; otherwise `null` if not mounted or dismissed.
 * @see useAnnouncementDismissal
 * @see Announcement
 * @see AnnouncementTag
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
   * - zLayer.popover:  Announcement banner (above navigation, below skip link)
   * - zLayer.modal:    Navigation, dialogs, sheets, dropdowns
   * - zLayer.raised:    Component-level overlays (badges, cards)
   *
   * Note: Navigation uses sticky top-0 zLayer.modal contain-layout which creates
   * a new stacking context. Without explicit z-index, the announcement would
   * be visually obscured by navigation's stacking context.
   */
  return (
    <section
      aria-label="Site announcement"
      aria-live="polite"
      aria-atomic="true"
      className={`relative ${zLayer.popover} hidden w-full ${padding.xCompact} pt-2 pb-2 md:block`}
    >
      {/* Rounded pill container */}
      <div className="container mx-auto">
        <div
          className={`${radius.full} border ${borderColor['accent/20']} ${bgColor['accent/10']} ${shadow.sm} ${backdrop.sm} ${transition.slow} hover:border-accent/30 hover:${shadow.md} motion-reduce:transition-none`}
        >
          <div className={`px-4 ${padding.yCompact} md:px-6 md:py-2.5`}>
            <div className={`flex ${flexDir.col} ${alignItems.center} ${justify.between} sm:flex-row`}>
              {/* Announcement Content */}
              <Announcement
                variant={announcement.variant}
                className={`flex-1 border-none ${bgColor.transparent} ${shadow.none}`}
              >
                {announcement.tag && (
                  <AnnouncementTag className={`shrink-0 ${weight.bold} ${size['2xs']} sm:${size.xs}`}>
                    {announcement.tag}
                  </AnnouncementTag>
                )}

                <AnnouncementTitle className={`${weight.semibold} ${size['3xs']} ${textColor.foreground} sm:${size.sm}`}>
                  {announcement.href ? (
                    <Link
                      href={announcement.href}
                      className={`hover:underline ${cluster.snug} ${transition.default}`}
                    >
                      <span className="line-clamp-2 sm:line-clamp-1">{announcement.title}</span>
                      {IconComponent && (
                        <IconComponent
                          className={`${iconSize.xs} shrink-0 sm:${iconSize.sm}`}
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  ) : (
                    <span className={cluster.snug}>
                      <span className="line-clamp-2 sm:line-clamp-1">{announcement.title}</span>
                      {IconComponent && (
                        <IconComponent
                          className={`${iconSize.xs} shrink-0 sm:${iconSize.sm}`}
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
                  className={`flex ${buttonMinHeight.icon} ${buttonMinWidth.icon} shrink-0 ${alignItems.center} ${justify.center} ${radius.full} ${transition.default} hover:bg-accent/20 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:${buttonMinHeight.iconMd} sm:${buttonMinWidth.iconMd}`}
                >
                  <X
                    className={`${iconSize.xs} ${textColor.foreground} sm:h-4 sm:w-4`}
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