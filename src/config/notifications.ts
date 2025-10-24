/**
 * Notification System Configuration
 *
 * Simple, static notification config for announcements and feedback solicitation.
 * No complex rotation or A/B testing - just active/inactive notifications.
 *
 * Usage:
 * - Add new notifications to ACTIVE_NOTIFICATIONS array
 * - Set active: false to disable
 * - Users can dismiss notifications (stored in localStorage)
 *
 * @module config/notifications
 */

export type NotificationType = 'announcement' | 'feedback';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface NotificationAction {
  label: string;
  href?: string;
  onClick?: string; // Function name for custom handlers
}

export interface Notification {
  /** Unique identifier (format: type-slug-YYYY-MM) */
  id: string;

  /** Notification category */
  type: NotificationType;

  /** Priority level (affects display order) */
  priority: NotificationPriority;

  /** Whether this notification is currently active */
  active: boolean;

  /** ISO date string - notification auto-hides after this date */
  expiresAt?: string;

  /** Notification title (short, action-oriented) */
  title: string;

  /** Notification message (1-2 sentences max) */
  message: string;

  /** Optional call-to-action */
  action?: NotificationAction;

  /** Optional icon (lucide icon name) */
  icon?: string;
}

/**
 * Active Notifications
 *
 * Add new notifications here. Oldest notifications are shown first.
 * Users can dismiss notifications - dismissed IDs are stored in localStorage.
 */
export const ACTIVE_NOTIFICATIONS: Notification[] = [
  // ANNOUNCEMENTS
  {
    id: 'announcement-launch-2025-10',
    type: 'announcement',
    priority: 'high',
    active: true,
    expiresAt: '2025-11-23',
    title: 'Welcome to Claude Pro Directory!',
    message:
      'Discover the best agents, MCP servers, commands, and more for Claude Code. Bookmark your favorites and join our community.',
    action: {
      label: 'Explore',
      href: '/agents',
    },
    icon: 'Sparkles',
  },

  // FEEDBACK SOLICITATION
  {
    id: 'feedback-general-2025-10',
    type: 'feedback',
    priority: 'low',
    active: true,
    title: 'Help us improve',
    message: "Got feedback? We'd love to hear from you! Quick 30-second survey.",
    action: {
      label: 'Share Feedback',
      href: '/contact?source=notification',
    },
    icon: 'MessageSquare',
  },
];

/**
 * Get all active, non-expired notifications
 */
export function getActiveNotifications(): Notification[] {
  const now = new Date();

  return ACTIVE_NOTIFICATIONS.filter((notification) => {
    // Filter out inactive notifications
    if (!notification.active) return false;

    // Filter out expired notifications
    if (notification.expiresAt) {
      const expiresAt = new Date(notification.expiresAt);
      if (now > expiresAt) return false;
    }

    return true;
  }).sort((a, b) => {
    // Sort by priority: high > medium > low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Get notification by ID
 */
export function getNotificationById(id: string): Notification | undefined {
  return ACTIVE_NOTIFICATIONS.find((n) => n.id === id);
}
