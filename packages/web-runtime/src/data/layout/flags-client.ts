/**
 * Layout Feature Flags - Client-Safe Export
 *
 * This is a client-only standalone implementation to avoid HMR issues with module resolution.
 * We duplicate the code here instead of re-exporting to prevent Turbopack from creating
 * internal module IDs that conflict with server-only code.
 */

/**
 * Layout feature flags result type
 * All flags with proper typing and fallback values
 */
export interface LayoutFlags {
  ctaVariant: 'aggressive' | 'social_proof' | 'value_focused';
  fabNotifications: boolean;
  fabNotificationsEnabled: boolean;
  footerDelayVariant: '10s' | '30s' | '60s';
  notificationsEnabled: boolean;
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
  fabNotifications: false,
  notificationsProvider: false,
  notificationsSheet: false,
  notificationsToasts: false,
  footerDelayVariant: '30s' as const,
  ctaVariant: 'value_focused' as const,
  notificationsEnabled: false,
  notificationsSheetEnabled: false,
  notificationsToastsEnabled: false,
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
