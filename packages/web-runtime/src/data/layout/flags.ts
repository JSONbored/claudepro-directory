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
}

/**
 * Default flag values (primary source of truth - no external service dependency)
 */
const DEFAULT_FLAGS: LayoutFlags = {
  ctaVariant: 'value_focused' as const,
  fabNotifications: false, // ❌ Disabled: Show notifications (mobile)
  fabNotificationsEnabled: false, // ❌ Disabled: FAB notifications
  footerDelayVariant: '30s' as const,
  notificationsEnabled: false, // ❌ Disabled: All notifications
  notificationsProvider: false, // ❌ Disabled: Notification provider
  notificationsSheet: false, // ❌ Disabled: Notification sheet
  notificationsSheetEnabled: false, // ❌ Disabled: Notification sheet
  notificationsToasts: false, // ❌ Disabled: Notification toasts
  notificationsToastsEnabled: false, // ❌ Disabled: Notification toasts
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
    fabNotificationsEnabled,
    notificationsEnabled,
    notificationsSheetEnabled,
    notificationsToastsEnabled,
  };
}
