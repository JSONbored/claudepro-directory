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
  // Floating Action Bar flags
  useFloatingActionBar: boolean;
  fabSubmitAction: boolean;
  fabSearchAction: boolean;
  fabScrollToTop: boolean;
  fabNotifications: boolean;

  // Notification flags
  notificationsProvider: boolean;
  notificationsSheet: boolean;
  notificationsToasts: boolean;

  // Newsletter experiment variants
  footerDelayVariant: '10s' | '30s' | '60s';
  ctaVariant: 'aggressive' | 'social_proof' | 'value_focused';

  // Computed/derived flags
  notificationsEnabled: boolean;
  notificationsSheetEnabled: boolean;
  notificationsToastsEnabled: boolean;
  fabNotificationsEnabled: boolean;
}


/**
 * Default flag values (primary source of truth - no external service dependency)
 */
const DEFAULT_FLAGS: LayoutFlags = {
  useFloatingActionBar: false,
  fabSubmitAction: false,
  fabSearchAction: false,
  fabScrollToTop: false,
  fabNotifications: false,
  notificationsProvider: true,
  notificationsSheet: true,
  notificationsToasts: true,
  footerDelayVariant: '30s' as const,
  ctaVariant: 'value_focused' as const,
  notificationsEnabled: true,
  notificationsSheetEnabled: true,
  notificationsToastsEnabled: true,
  fabNotificationsEnabled: false,
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
