'use client';

/**
 * Hero-Search Connection Context
 *
 * Coordinates interaction between hero background and search bar.
 * Creates a cohesive, connected experience where hero responds to search interaction.
 */

import { createContext, useContext, useState, type ReactNode } from 'react';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';
import type { UnifiedSearchProps } from '@heyclaude/web-runtime/types/component.types';

interface HeroSearchConnectionContextValue {
  /** Whether search is currently focused */
  isSearchFocused: boolean;
  /** Set search focus state */
  setSearchFocused: (focused: boolean) => void;
  /** Search props for rendering search in hero */
  searchProps?:
    | (Omit<UnifiedSearchProps, 'placeholder'> & {
        placeholder?: string;
        onFocusChange?: (isFocused: boolean) => void;
      })
    | undefined;
  /** Set search props */
  setSearchProps: (props: HeroSearchConnectionContextValue['searchProps']) => void;
}

const HeroSearchConnectionContext = createContext<HeroSearchConnectionContextValue | null>(null);

export function HeroSearchConnectionProvider({ children }: { children: ReactNode }) {
  const { value: isSearchFocused, setValue: setSearchFocused } = useBoolean();
  const [searchProps, setSearchProps] = useState<HeroSearchConnectionContextValue['searchProps']>();

  return (
    <HeroSearchConnectionContext.Provider
      value={{
        isSearchFocused,
        setSearchFocused,
        searchProps,
        setSearchProps,
      }}
    >
      {children}
    </HeroSearchConnectionContext.Provider>
  );
}

export function useHeroSearchConnection() {
  const context = useContext(HeroSearchConnectionContext);
  if (!context) {
    throw new Error('useHeroSearchConnection must be used within HeroSearchConnectionProvider');
  }
  return context;
}
