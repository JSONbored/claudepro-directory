'use client';

/**
 * useComponentCardConfig Hook
 *
 * Provides component card configuration via React context
 * Generic pattern for feature flag-based UI visibility control
 */

import { createContext, type ReactNode, useContext } from 'react';
import {
  type ComponentCardConfig,
  DEFAULT_COMPONENT_CARD_CONFIG,
} from '../utils/component-card-config.ts';

// Re-export types and constants for backward compatibility
export type { ComponentCardConfig };
export { DEFAULT_COMPONENT_CARD_CONFIG };

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
