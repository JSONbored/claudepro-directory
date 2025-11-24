'use client';

import { createContext, type ReactNode, useContext } from 'react';
import type { ComponentCardConfig } from './component-config-shared';
import { DEFAULT_COMPONENT_CARD_CONFIG } from './component-config-shared';

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
