/**
 * Layout Feature Flags - Static Defaults
 *
 * Returns static default flag values.
 * All flags are version-controlled in code.
 *
 * This file is safe to use in both server and client components since it only returns static values.
 */

/**
 * Layout feature flags result type
 * All flags with proper typing and fallback values
 */
export interface LayoutFlags {
  ctaVariant: 'aggressive' | 'social_proof' | 'value_focused';
  fabNotifications: boolean;
  fabNotificationsEnabled: boolean;
  fabScrollToTop: boolean;
  fabSearchAction: boolean;

  fabSubmitAction: boolean;
  // Newsletter experiment variants
  footerDelayVariant: '10s' | '30s' | '60s';
  // Computed/derived flags
  notificationsEnabled: boolean;

  // Notification flags
  notificationsProvider: boolean;
  notificationsSheet: boolean;

  notificationsSheetEnabled: boolean;
  notificationsToasts: boolean;
  notificationsToastsEnabled: boolean;
  // Floating Action Bar flags
  useFloatingActionBar: boolean;
}

/**
 * Default flag values (primary source of truth - no external service dependency)
 *
 * FAB Actions:
 * - Submit: Navigate to /submit page
 * - Search: Focus the search input (⌘K)
 * - Scroll to Top: Smooth scroll to page top
 * - Pinboard: Open pinboard drawer (always enabled)
 * - Notifications: Show notification badge (mobile only)
 */
const DEFAULT_FLAGS: LayoutFlags = {
  useFloatingActionBar: true, // ✅ Enable the FAB
  fabSubmitAction: true, // ✅ Show "Submit Content" action
  fabSearchAction: true, // ✅ Show "Search (⌘K)" action
  fabScrollToTop: true, // ✅ Show "Scroll to top" action
  fabNotifications: false, // ❌ Disabled: Show notifications (mobile)
  notificationsProvider: false, // ❌ Disabled: Notification provider
  notificationsSheet: false, // ❌ Disabled: Notification sheet
  notificationsToasts: false, // ❌ Disabled: Notification toasts
  footerDelayVariant: '30s' as const,
  ctaVariant: 'value_focused' as const,
  notificationsEnabled: false, // ❌ Disabled: All notifications
  notificationsSheetEnabled: false, // ❌ Disabled: Notification sheet
  notificationsToastsEnabled: false, // ❌ Disabled: Notification toasts
  fabNotificationsEnabled: false, // ❌ Disabled: FAB notifications
};

/**
 * Get layout feature flags
 * Returns static default values (no async operations)
 */
export function getLayoutFlags(): LayoutFlags {
  // Compute derived flags (business logic)
  const notificationsEnabled = DEFAULT_FLAGS.notificationsProvider;
  const notificationsSheetEnabled = DEFAULT_FLAGS.notificationsSheet;
  const notificationsToastsEnabled = DEFAULT_FLAGS.notificationsToasts;
  const fabNotificationsEnabled = Boolean(DEFAULT_FLAGS.fabNotifications && notificationsEnabled);

  return {
    ...DEFAULT_FLAGS,
    notificationsEnabled,
    notificationsSheetEnabled,
    notificationsToastsEnabled,
    fabNotificationsEnabled,
  };
}
