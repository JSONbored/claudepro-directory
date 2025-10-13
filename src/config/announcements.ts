/**
 * Announcements Configuration
 *
 * Central configuration for site-wide announcements.
 * Supports time-based display, priority sorting, and dismissible states.
 *
 * @example
 * ```ts
 * const announcement = getActiveAnnouncement();
 * if (announcement) {
 *   // Display announcement
 * }
 * ```
 *
 * Management:
 * - Add new announcements to the array below
 * - Set start/end dates for time-limited announcements
 * - Use priority to control which announcement shows (high > medium > low)
 * - Mark critical announcements as non-dismissible
 *
 * @see Research Report: "shadcn Announcement Component Integration"
 */

export interface AnnouncementConfig {
  /**
   * Unique identifier for dismissal tracking
   * Format: kebab-case with date prefix
   * @example "statuslines-launch-2025-10-09"
   */
  id: string;

  /**
   * Visual variant
   * - default: Accent background (primary features)
   * - outline: Border only (standard updates)
   * - secondary: Muted (low-priority)
   * - destructive: Red (warnings/maintenance)
   */
  variant: 'default' | 'outline' | 'secondary' | 'destructive';

  /**
   * Optional category tag (e.g., "New", "Beta", "Update")
   * Displayed as small badge on left
   */
  tag?: string;

  /**
   * Main announcement text (max 100 characters recommended)
   */
  title: string;

  /**
   * Optional link destination
   * If provided, announcement becomes clickable
   */
  href?: string;

  /**
   * Optional Lucide icon name (e.g., "ArrowUpRight", "AlertTriangle")
   * Will be displayed next to title
   */
  icon?: string;

  /**
   * Start date (ISO 8601 format)
   * Announcement won't display before this date
   * @example "2025-10-09T00:00:00Z"
   */
  startDate?: string;

  /**
   * End date (ISO 8601 format)
   * Announcement won't display after this date
   * @example "2025-10-16T23:59:59Z"
   */
  endDate?: string;

  /**
   * Priority level determines which announcement shows when multiple are active
   * high > medium > low
   */
  priority: 'high' | 'medium' | 'low';

  /**
   * Whether users can dismiss this announcement
   * Set to false for critical alerts (maintenance, security)
   */
  dismissible: boolean;
}

/**
 * Active Announcements
 *
 * Add new announcements here. Only ONE announcement displays at a time.
 * Selection priority:
 * 1. Date range (must be within start/end dates)
 * 2. Priority (high > medium > low)
 * 3. Most recent start date (if same priority)
 */
export const announcements: AnnouncementConfig[] = [
  // Example: New Category Launch
  {
    id: 'statuslines-launch-2025-10',
    variant: 'default',
    tag: 'New',
    title: 'Introducing Statuslines - Customize your editor status bar',
    href: '/statuslines',
    icon: 'ArrowUpRight',
    startDate: '2025-10-10T00:00:00Z',
    endDate: '2025-10-17T23:59:59Z',
    priority: 'high',
    dismissible: true,
  },

  // Example: Collections Launch
  {
    id: 'collections-launch-2025-10',
    variant: 'default',
    tag: 'New',
    title: 'Collections are live - Curated bundles of Claude configurations',
    href: '/collections',
    icon: 'ArrowUpRight',
    startDate: '2025-10-10T00:00:00Z',
    endDate: '2025-10-17T23:59:59Z',
    priority: 'high',
    dismissible: true,
  },

  // Example: Command Menu Feature
  {
    id: 'command-menu-2025-10',
    variant: 'outline',
    tag: 'Feature',
    title: 'Try the new Command Menu - Press ⌘K to navigate instantly',
    startDate: '2025-10-10T00:00:00Z',
    endDate: '2025-10-17T23:59:59Z',
    priority: 'medium',
    dismissible: true,
  },

  // Example: Maintenance Warning (uncomment when needed)
  // {
  //   id: 'maintenance-2025-10-15',
  //   variant: 'destructive',
  //   tag: 'Maintenance',
  //   title: 'Scheduled maintenance Oct 15, 2am-4am PT - Limited functionality',
  //   href: '/status',
  //   icon: 'AlertTriangle',
  //   startDate: '2025-10-14T00:00:00Z',
  //   endDate: '2025-10-15T12:00:00Z',
  //   priority: 'high',
  //   dismissible: false, // Critical - can't dismiss
  // },
];

/**
 * Get Active Announcement
 *
 * Returns the highest-priority announcement that:
 * 1. Falls within its date range
 * 2. Hasn't been dismissed by the user (checked in component)
 *
 * @returns Active announcement or null if none available
 */
export function getActiveAnnouncement(): AnnouncementConfig | null {
  const now = new Date();

  const activeAnnouncements = announcements
    .filter((announcement) => {
      // Check date range
      const start = announcement.startDate ? new Date(announcement.startDate) : new Date(0);
      const end = announcement.endDate ? new Date(announcement.endDate) : new Date('2099-12-31');

      return now >= start && now <= end;
    })
    .sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];

      if (priorityDiff !== 0) return priorityDiff;

      // If same priority, sort by most recent start date
      const aStart = new Date(a.startDate || 0);
      const bStart = new Date(b.startDate || 0);
      return bStart.getTime() - aStart.getTime();
    });

  return activeAnnouncements[0] || null;
}

/**
 * Get All Active Announcements
 *
 * Returns all announcements within their date range (not just the top one).
 * Useful for admin interfaces or announcement management pages.
 *
 * @returns Array of active announcements sorted by priority
 */
export function getAllActiveAnnouncements(): AnnouncementConfig[] {
  const now = new Date();

  return announcements
    .filter((announcement) => {
      const start = announcement.startDate ? new Date(announcement.startDate) : new Date(0);
      const end = announcement.endDate ? new Date(announcement.endDate) : new Date('2099-12-31');
      return now >= start && now <= end;
    })
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}
