'use client';

import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';
import { createContext, useContext, useMemo } from 'react';

interface CommandPaletteContextValue {
  closePalette: () => void;
  openPalette: () => void;
  togglePalette: () => void;
  isOpen: boolean;
}

const CommandPaletteContext = createContext<null | CommandPaletteContextValue>(null);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const {
    value: isOpen,
    setTrue: openPalette,
    setFalse: closePalette,
    toggle: togglePalette,
  } = useBoolean();

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
    <CommandPaletteContext.Provider value={contextValue}>{children}</CommandPaletteContext.Provider>
  );
}

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    // Log when provider is not available (should not happen in normal flow)
    const error = new Error('useCommandPalette called outside CommandPaletteProvider');
    logClientWarn(
      '[Navigation] Hook used outside provider context',
      normalizeError(error, 'CommandPaletteProvider not available'),
      'useCommandPalette.missingProvider',
      {
        component: 'CommandPaletteProvider',
        action: 'hook-call-outside-provider',
        category: 'navigation',
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
