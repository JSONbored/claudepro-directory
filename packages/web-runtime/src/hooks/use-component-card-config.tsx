'use client';

/**
 * useComponentCardConfig Hook
 *
 * Provides component card configuration via React context
 * Generic pattern for feature flag-based UI visibility control
 */

import { createContext, type ReactNode, useContext } from 'react';

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

const ComponentConfigContext = createContext<ComponentCardConfig>(DEFAULT_COMPONENT_CARD_CONFIG);

export function useComponentCardConfig(): ComponentCardConfig {
  return useContext(ComponentConfigContext);
}

export function ComponentConfigContextProvider({
  value,
  children,
}: {
  value?: ComponentCardConfig;
  children: ReactNode;
}) {
  return (
    <ComponentConfigContext.Provider value={value ?? DEFAULT_COMPONENT_CARD_CONFIG}>
      {children}
    </ComponentConfigContext.Provider>
  );
}
