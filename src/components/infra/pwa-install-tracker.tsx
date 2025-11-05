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
import { trackEvent } from '@/src/lib/analytics/tracker';

export function PwaInstallTracker() {
  useEffect(() => {
    // Track when PWA becomes installable
    const handleInstallable = () => {
      trackEvent('pwa_installable', {
        platform: navigator.platform || 'unknown',
        user_agent: navigator.userAgent,
      });
    };

    // Track successful installation
    const handleInstalled = () => {
      trackEvent('pwa_installed', {
        platform: navigator.platform || 'unknown',
        timestamp: new Date().toISOString(),
      });
    };

    // Track standalone launch (from home screen)
    const handleStandaloneLaunch = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        trackEvent('pwa_launched', {
          platform: navigator.platform || 'unknown',
          timestamp: new Date().toISOString(),
        });
      }
    };

    // Listen for PWA events dispatched by service-worker-init.js
    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    // Check standalone mode on mount
    handleStandaloneLaunch();

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
