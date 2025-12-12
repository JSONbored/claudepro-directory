'use client';

/**
 * Context for sharing search handlers between hero and home-sections
 * This allows the hero to render the search UI while home-sections manages the logic
 */

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { UnifiedSearchProps } from '@heyclaude/web-runtime/types/component.types';

interface HeroSearchContextValue {
  searchProps?: Omit<UnifiedSearchProps, 'placeholder'> & {
    placeholder?: string;
    onFocusChange?: (isFocused: boolean) => void;
  } | undefined;
  setSearchProps: (props: HeroSearchContextValue['searchProps']) => void;
}

const HeroSearchContext = createContext<HeroSearchContextValue | undefined>(undefined);

export function HeroSearchProvider({ children }: { children: ReactNode }) {
  const [searchProps, setSearchProps] = useState<HeroSearchContextValue['searchProps']>();

  return (
    <HeroSearchContext.Provider value={{ searchProps, setSearchProps }}>
      {children}
    </HeroSearchContext.Provider>
  );
}

export function useHeroSearchContext() {
  const context = useContext(HeroSearchContext);
  if (!context) {
    throw new Error('useHeroSearchContext must be used within HeroSearchProvider');
  }
  return context;
}
