import { getComponentConfig } from '@heyclaude/web-runtime/actions';
import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import type { ReactNode } from 'react';
import {
  type ComponentCardConfig,
  ComponentConfigContextProvider,
  DEFAULT_COMPONENT_CARD_CONFIG,
} from './component-config-context';

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function mapConfigRecord(record: Record<string, unknown> | null): ComponentCardConfig {
  if (!record) {
    return DEFAULT_COMPONENT_CARD_CONFIG;
  }

  return {
    showCopyButton: coerceBoolean(record['cards.show_copy_button'], true),
    showBookmark: coerceBoolean(record['cards.show_bookmark'], true),
    showViewCount: coerceBoolean(record['cards.show_view_count'], true),
    showCopyCount: coerceBoolean(record['cards.show_copy_count'], true),
    showRating: coerceBoolean(record['cards.show_rating'], true),
  };
}

export async function ComponentConfigProvider({ children }: { children: ReactNode }) {
  try {
    const result = await getComponentConfig({});
    const configRecord = result?.data ?? null;

    if (result?.serverError) {
      logger.warn('ComponentConfigProvider: server error loading component config', {
        error: result.serverError,
      });
    }

    const value = mapConfigRecord(configRecord);
    return (
      <ComponentConfigContextProvider value={value}>{children}</ComponentConfigContextProvider>
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load component config');
    logger.error('ComponentConfigProvider: falling back to defaults', normalized);
    return (
      <ComponentConfigContextProvider value={DEFAULT_COMPONENT_CARD_CONFIG}>
        {children}
      </ComponentConfigContextProvider>
    );
  }
}
