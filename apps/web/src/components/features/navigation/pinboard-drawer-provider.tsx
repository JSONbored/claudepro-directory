'use client';

import { usePulse } from '@heyclaude/web-runtime/hooks';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { PinboardDrawer } from '@/src/components/features/navigation/pinboard-drawer';

interface PinboardDrawerContextValue {
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const PinboardDrawerContext = createContext<PinboardDrawerContextValue | null>(null);

export function PinboardDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pulse = usePulse();

  const trackDrawerEvent = useCallback(
    (action: 'open' | 'close') => {
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
    setIsOpen(true);
    trackDrawerEvent('open');
  }, [trackDrawerEvent]);
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
    }),
    [openDrawer, closeDrawer, toggleDrawer]
  );

  return (
    <PinboardDrawerContext.Provider value={contextValue}>
      {children}
      <PinboardDrawer open={isOpen} onOpenChange={setIsOpen} />
    </PinboardDrawerContext.Provider>
  );
}

export function usePinboardDrawer(): PinboardDrawerContextValue {
  const ctx = useContext(PinboardDrawerContext);
  if (!ctx) {
    throw new Error('usePinboardDrawer must be used within a PinboardDrawerProvider');
  }
  return ctx;
}
