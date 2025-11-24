'use client';

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
