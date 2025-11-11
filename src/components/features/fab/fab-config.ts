/**
 * Floating Action Bar Configuration
 *
 * Centralized config for main FAB button and speed dial items.
 * Consolidates logic from:
 * - FloatingMobileSearch
 * - BackToTopButton
 * - NotificationFAB
 * - Navigation Create button
 *
 * @module components/features/fab/fab-config
 */

'use client';

import { ArrowUp, Bell, Plus, Search } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { MainFABConfig, SpeedDialAction } from './fab.types';

/**
 * Scroll to top with smooth behavior and error handling
 */
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

/**
 * Focus search input with scroll into view and error handling
 */
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

/**
 * Main FAB configuration (Create button)
 * Navigates to /submit page
 */
export const createMainFABConfig = (onNavigate: () => void): MainFABConfig => ({
  icon: Plus,
  label: 'Create new submission',
  onClick: onNavigate,
});

/**
 * Speed dial actions configuration
 * @param unreadCount - Notification count for conditional badge display
 * @param onNotificationsClick - Handler to open notifications sheet
 */
export const createSpeedDialActions = (
  unreadCount: number,
  onNotificationsClick: () => void
): SpeedDialAction[] => [
  // Search - All breakpoints
  {
    id: 'search',
    icon: Search,
    label: 'Search (⌘K)',
    onClick: handleSearchClick,
    show: true,
  },

  // Scroll to Top - All breakpoints
  {
    id: 'scroll-top',
    icon: ArrowUp,
    label: 'Scroll to top',
    onClick: handleScrollToTop,
    show: true,
  },

  // Notifications - Mobile only, conditional on unread count
  {
    id: 'notifications',
    icon: Bell,
    label: 'Notifications',
    onClick: onNotificationsClick,
    badge: unreadCount,
    mobileOnly: true,
    show: unreadCount > 0,
  },
];
