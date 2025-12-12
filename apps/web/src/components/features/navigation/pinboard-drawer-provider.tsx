'use client';

import { usePulse } from '@heyclaude/web-runtime/hooks';
import { logClientWarn, logClientInfo, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { ErrorBoundary } from '@heyclaude/web-runtime/ui';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { PinboardDrawer, type PinboardDrawerProps } from '@/src/components/features/navigation/pinboard-drawer';

/**
 * PinboardDrawer wrapper with error handling
 * Catches render errors and closes drawer gracefully
 */
function PinboardDrawerWithErrorHandling({
  onError,
  onOpenChange,
  ...props
}: PinboardDrawerProps & { onError?: (error: Error) => void }) {
  // Wrap onOpenChange to also call onError handler if needed
  const handleOpenChange = useCallback((open: boolean) => {
    try {
      onOpenChange(open);
    } catch (error) {
      const normalized = normalizeError(error, 'PinboardDrawer onOpenChange error');
      onError?.(normalized);
    }
  }, [onOpenChange, onError]);

  return <PinboardDrawer {...props} onOpenChange={handleOpenChange} />;
}

interface PinboardDrawerContextValue {
  closeDrawer: () => void;
  openDrawer: () => void;
  toggleDrawer: () => void;
  isOpen: boolean;
}

const PinboardDrawerContext = createContext<null | PinboardDrawerContextValue>(null);

export function PinboardDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pulse = usePulse();

  const trackDrawerEvent = useCallback(
    (action: 'close' | 'open') => {
      pulse
        .click({
          category: null,
          slug: null,
          metadata: { component: 'pinboard', action },
        })
        .catch(() => {
          // Best-effort tracking; ignore failures
        });
    },
    [pulse]
  );

  const openDrawer = useCallback(() => {
    try {
      logClientInfo(
        '[PinboardDrawerProvider] Opening drawer - BEFORE setState',
        'PinboardDrawerProvider.openDrawer.before',
        {
          component: 'PinboardDrawerProvider',
          action: 'open-drawer-before',
          category: 'navigation',
          currentState: isOpen,
          willSetTo: true,
        }
      );
      setIsOpen(true);
      logClientInfo(
        '[PinboardDrawerProvider] Opening drawer - AFTER setState',
        'PinboardDrawerProvider.openDrawer.after',
        {
          component: 'PinboardDrawerProvider',
          action: 'open-drawer-after',
          category: 'navigation',
          stateSetTo: true,
        }
      );
      trackDrawerEvent('open');
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to open pinboard drawer');
      logClientWarn(
        '[Navigation] Failed to open pinboard drawer',
        normalized,
        'pinboard.openDrawer.error',
        {
          component: 'PinboardDrawerProvider',
          action: 'openDrawer',
          category: 'navigation',
        }
      );
    }
  }, [trackDrawerEvent, isOpen]);
  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    trackDrawerEvent('close');
  }, [trackDrawerEvent]);
  const toggleDrawer = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      trackDrawerEvent(next ? 'open' : 'close');
      return next;
    });
  }, [trackDrawerEvent]);

  const contextValue = useMemo(
    () => ({
      openDrawer,
      closeDrawer,
      toggleDrawer,
      isOpen,
    }),
    [openDrawer, closeDrawer, toggleDrawer, isOpen]
  );

  return (
    <PinboardDrawerContext.Provider value={contextValue}>
      {children}
      <ErrorBoundary>
        <PinboardDrawerWithErrorHandling
          open={isOpen}
          onOpenChange={(open: boolean) => {
            setIsOpen(open);
            if (!open) {
              // Ensure cleanup on close
            }
          }}
          onError={(error: Error) => {
            logClientWarn(
              '[PinboardDrawerProvider] PinboardDrawer render error',
              normalizeError(error, 'PinboardDrawer render failed'),
              'PinboardDrawerProvider.drawerError',
              {
                component: 'PinboardDrawerProvider',
                action: 'drawer-render-error',
                category: 'navigation',
                errorMessage: error.message,
                errorStack: error.stack,
              }
            );
            // Close drawer on error to prevent stuck state
            setIsOpen(false);
          }}
        />
      </ErrorBoundary>
    </PinboardDrawerContext.Provider>
  );
}

export function usePinboardDrawer(): PinboardDrawerContextValue {
  const ctx = useContext(PinboardDrawerContext);
  if (!ctx) {
    // During SSR, the provider isn't available yet (it's in client-side LayoutContent)
    // This is expected and handled gracefully with a no-op fallback
    const isSSR = typeof window === 'undefined';
    
    if (!isSSR) {
      // Only log warning on client-side (not during SSR)
      // SSR warnings are expected and handled by fallback
      const error = new Error('usePinboardDrawer called outside PinboardDrawerProvider');
      logClientWarn(
        '[Navigation] Hook used outside provider context',
        normalizeError(error, 'PinboardDrawerProvider not available'),
        'usePinboardDrawer.missingProvider',
        {
          component: 'PinboardDrawerProvider',
          action: 'hook-call-outside-provider',
          category: 'navigation',
          stack: error.stack,
        }
      );
    }

    // Fallback for cases where provider might not be available yet (SSR, initial render)
    // This prevents errors during hydration and allows graceful degradation
    return {
      openDrawer: () => {
        // No-op if provider not available - already logged above (client-side only)
      },
      closeDrawer: () => {
        // No-op if provider not available
      },
      toggleDrawer: () => {
        // No-op if provider not available
      },
      isOpen: false,
    };
  }
  return ctx;
}
