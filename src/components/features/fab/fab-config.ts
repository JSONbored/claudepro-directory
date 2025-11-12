'use client';

/** FAB configuration for main button and speed dial actions */

import { ArrowUp, Bell, FileText, Plus, Search } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { MainFABConfig, SpeedDialAction } from './fab.types';

export const handleScrollToTop = (): void => {
  try {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  } catch (error) {
    logger.error('[FAB] Error scrolling to top', error as Error);
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
    logger.error('[FAB] Error focusing search', error as Error);
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
  flags: {
    showSubmit: boolean;
    showSearch: boolean;
    showScrollToTop: boolean;
    showNotifications: boolean;
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
