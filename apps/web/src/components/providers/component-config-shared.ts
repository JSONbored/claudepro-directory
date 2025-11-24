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
      record['cards.show_copy_button'],
      DEFAULT_COMPONENT_CARD_CONFIG.showCopyButton
    ),
    showBookmark: coerce(record['cards.show_bookmark'], DEFAULT_COMPONENT_CARD_CONFIG.showBookmark),
    showViewCount: coerce(
      record['cards.show_view_count'],
      DEFAULT_COMPONENT_CARD_CONFIG.showViewCount
    ),
    showCopyCount: coerce(
      record['cards.show_copy_count'],
      DEFAULT_COMPONENT_CARD_CONFIG.showCopyCount
    ),
    showRating: coerce(record['cards.show_rating'], DEFAULT_COMPONENT_CARD_CONFIG.showRating),
  };
}
