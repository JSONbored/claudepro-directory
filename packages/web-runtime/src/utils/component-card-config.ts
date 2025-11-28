/**
 * Component Card Config Utilities (Server-Safe)
 * 
 * Pure utility functions for component card configuration mapping.
 * These functions are server-safe and can be used in both client and server contexts.
 * 
 * The React hook and context provider remain in use-component-card-config.tsx (client-only).
 */

export type ComponentCardConfig = {
  showCopyButton: boolean;
  showBookmark: boolean;
  showViewCount: boolean;
  showCopyCount: boolean;
  showRating: boolean;
};

export const DEFAULT_COMPONENT_CARD_CONFIG: ComponentCardConfig = {
  showCopyButton: true,
  showBookmark: true,
  showViewCount: true,
  showCopyCount: true,
  showRating: true,
};

/**
 * Map component card configuration from record format to typed config
 * 
 * Server-safe utility function (no React hooks, no browser APIs)
 * Can be used in both server and client contexts.
 * 
 * @param record - Configuration record with keys like 'cards.show_copy_button'
 * @returns Mapped ComponentCardConfig
 */
export function mapComponentCardConfig(
  record: Record<string, unknown> | null
): ComponentCardConfig {
  if (!record) {
    return DEFAULT_COMPONENT_CARD_CONFIG;
  }

  const coerce = (value: unknown, fallback: boolean) =>
    typeof value === 'boolean' ? value : fallback;

  return {
    showCopyButton: coerce(
      record['cards.show_copy_button' as string],
      DEFAULT_COMPONENT_CARD_CONFIG.showCopyButton
    ),
    showBookmark: coerce(
      record['cards.show_bookmark' as string],
      DEFAULT_COMPONENT_CARD_CONFIG.showBookmark
    ),
    showViewCount: coerce(
      record['cards.show_view_count' as string],
      DEFAULT_COMPONENT_CARD_CONFIG.showViewCount
    ),
    showCopyCount: coerce(
      record['cards.show_copy_count' as string],
      DEFAULT_COMPONENT_CARD_CONFIG.showCopyCount
    ),
    showRating: coerce(
      record['cards.show_rating' as string],
      DEFAULT_COMPONENT_CARD_CONFIG.showRating
    ),
  };
}
