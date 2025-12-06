'use client';

import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface CommandPaletteContextValue {
  closePalette: () => void;
  openPalette: () => void;
  togglePalette: () => void;
  isOpen: boolean;
}

const CommandPaletteContext = createContext<null | CommandPaletteContextValue>(null);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openPalette = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
  }, []);

  const togglePalette = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const contextValue = useMemo(
    () => ({
      openPalette,
      closePalette,
      togglePalette,
      isOpen,
    }),
    [openPalette, closePalette, togglePalette, isOpen]
  );

  return (
    <CommandPaletteContext.Provider value={contextValue}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    // Log when provider is not available (should not happen in normal flow)
    const error = new Error('useCommandPalette called outside CommandPaletteProvider');
    logClientWarn(
      '[CommandPaletteProvider] Hook used outside provider context',
      normalizeError(error, 'CommandPaletteProvider not available'),
      'useCommandPalette.missingProvider',
      {
        component: 'CommandPaletteProvider',
        action: 'hook-call-outside-provider',
        stack: error.stack,
      }
    );

    // Fallback for cases where provider might not be available yet (SSR, initial render)
    // This prevents errors during hydration and allows graceful degradation
    return {
      isOpen: false,
      openPalette: () => {
        // No-op if provider not available - already logged above
      },
      closePalette: () => {
        // No-op if provider not available
      },
      togglePalette: () => {
        // No-op if provider not available
      },
    };
  }
  return ctx;
}
