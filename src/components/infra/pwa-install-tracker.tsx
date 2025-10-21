'use client';

/**
 * PWA Install Tracker Component
 *
 * Tracks PWA installation events using the standard trackEvent pattern.
 * Listens to browser-level PWA events dispatched by service-worker-init.js
 * and tracks them through our centralized analytics system.
 *
 * Events Tracked:
 * - pwa_installable: Browser shows PWA can be installed
 * - pwa_installed: User successfully installed PWA
 * - pwa_launched: App opened in standalone mode (from home screen)
 *
 * Architecture:
 * - Service worker init dispatches custom DOM events
 * - This component listens and forwards to trackEvent()
 * - Provides consistent event config, sampling, and validation
 *
 * @module components/shared/pwa-install-tracker
 */

import { useEffect } from 'react';
import { EVENTS } from '@/src/lib/analytics/events.constants';
import { trackEvent } from '@/src/lib/analytics/tracker';

const EVENT_DEBOUNCE_MS = 60_000;

const lastFired: Partial<Record<string, number>> = {};

function trackUnique(eventName: keyof typeof EVENTS, payload: Record<string, unknown>) {
  const now = Date.now();
  const last = lastFired[eventName];

  if (last && now - last < EVENT_DEBOUNCE_MS) {
    return;
  }

  lastFired[eventName] = now;
  trackEvent(EVENTS[eventName], payload as never);
}

export function PwaInstallTracker() {
  useEffect(() => {
    // Track when PWA becomes installable
    const handleInstallable = () => {
      if (navigator.userAgent.toLowerCase().includes('bot')) return;
      trackUnique('PWA_INSTALLABLE', {
        platform: navigator.platform || 'unknown',
      });
    };

    // Track successful installation
    const handleInstalled = () => {
      trackUnique('PWA_INSTALLED', {
        platform: navigator.platform || 'unknown',
        timestamp: new Date().toISOString(),
      });
    };

    const handlePromptAccepted = () => {
      trackUnique('PWA_PROMPT_ACCEPTED', {
        platform: navigator.platform || 'unknown',
        timestamp: new Date().toISOString(),
      });
    };

    const handlePromptDismissed = () => {
      trackUnique('PWA_PROMPT_DISMISSED', {
        platform: navigator.platform || 'unknown',
        timestamp: new Date().toISOString(),
      });
    };

    const handleStandaloneLaunch = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        trackUnique('PWA_LAUNCHED', {
          platform: navigator.platform || 'unknown',
          timestamp: new Date().toISOString(),
        });
      }
    };

    // Listen for PWA events dispatched by service-worker-init.js
    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);
    window.addEventListener('pwa-prompt-accepted', handlePromptAccepted);
    window.addEventListener('pwa-prompt-dismissed', handlePromptDismissed);

    // Check standalone mode on mount
    handleStandaloneLaunch();

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
      window.removeEventListener('pwa-prompt-accepted', handlePromptAccepted);
      window.removeEventListener('pwa-prompt-dismissed', handlePromptDismissed);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
