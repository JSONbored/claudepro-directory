'use client';

/**
 * FAB configuration for main button and speed dial actions
 *
 * Supports:
 * - Standard navigation actions (Submit, Search, Pinboard, Scroll to Top)
 * - Context-aware actions for detail pages (Copy Link, Share)
 * - Notification badge (mobile only)
 */

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { ArrowUp, Bell, Bookmark, Copy, FileText, Plus, Search, Share2 } from '@heyclaude/web-runtime/icons';
import type { MainFABConfig, SpeedDialAction } from '@heyclaude/web-runtime/types/component.types';

export const handleScrollToTop = (): void => {
  try {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  } catch (error) {
    const normalized = normalizeError(error, '[FAB] Error scrolling to top');
    logger.error('[FAB] Error scrolling to top', normalized);
  }
};

export const handleSearchClick = (): void => {
  try {
    const searchInput = document.querySelector<HTMLInputElement>(
      'input[type="search"], input[name="search"]'
    );

    if (searchInput) {
      searchInput.focus();
      searchInput.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  } catch (error) {
    const normalized = normalizeError(error, '[FAB] Error focusing search');
    logger.error('[FAB] Error focusing search', normalized);
  }
};

export const createMainFABConfig = (onNavigate: () => void): MainFABConfig => ({
  icon: Plus,
  label: 'Create new submission',
  onClick: onNavigate,
});

/**
 * Speed dial actions configuration
 * @param unreadCount - Notification count for conditional badge display
 * @param onNotificationsClick - Handler to open notifications sheet
 * @param flags - Feature flags controlling which actions to show
 */
export const createSpeedDialActions = (
  unreadCount: number,
  onNotificationsClick: () => void,
  onSubmitClick: () => void,
  onPinboardClick: () => void,
  flags: {
    showSubmit: boolean;
    showSearch: boolean;
    showScrollToTop: boolean;
    showNotifications: boolean;
    showPinboard: boolean;
  }
): SpeedDialAction[] => [
  // Submit - All breakpoints
  {
    id: 'submit',
    icon: FileText,
    label: 'Submit Content',
    onClick: onSubmitClick,
    show: flags.showSubmit,
  },

  // Search - All breakpoints
  {
    id: 'search',
    icon: Search,
    label: 'Search (⌘K)',
    onClick: handleSearchClick,
    show: flags.showSearch,
  },

  // Pinboard - All breakpoints
  {
    id: 'pinboard',
    icon: Bookmark,
    label: 'Open pinboard',
    onClick: onPinboardClick,
    show: flags.showPinboard,
  },

  // Scroll to Top - All breakpoints
  {
    id: 'scroll-top',
    icon: ArrowUp,
    label: 'Scroll to top',
    onClick: handleScrollToTop,
    show: flags.showScrollToTop,
  },

  // Notifications - Mobile only, conditional on unread count
  {
    id: 'notifications',
    icon: Bell,
    label: 'Notifications',
    onClick: onNotificationsClick,
    badge: unreadCount,
    mobileOnly: true,
    show: flags.showNotifications && unreadCount > 0,
  },
];

/**
 * Context-aware actions for detail pages
 * These appear at the top of the speed dial when on a content detail page
 */
export const createDetailPageActions = (
  onCopyLink: () => void,
  onShare: () => void
): SpeedDialAction[] => [
  {
    id: 'copy-link',
    icon: Copy,
    label: 'Copy link',
    onClick: onCopyLink,
    show: true,
  },
  {
    id: 'share',
    icon: Share2,
    label: 'Share',
    onClick: onShare,
    show: true,
  },
];
