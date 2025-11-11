'use client';

/**
 * PWA Install Tracker Component
 *
 * Tracks PWA installation events using trackInteraction() to database.
 * Listens to browser-level PWA events dispatched by service-worker-init.js
 * and stores them in user_interactions table.
 *
 * Events Tracked:
 * - pwa_installable: Browser shows PWA can be installed
 * - pwa_installed: User successfully installed PWA
 * - pwa_launched: App opened in standalone mode (from home screen)
 *
 * Architecture:
 * - Service worker init dispatches custom DOM events
 * - This component listens and forwards to trackInteraction()
 * - Data stored in user_interactions table with NULL content fields
 *
 * @module components/infra/pwa-install-tracker
 */

import { useEffect } from 'react';
import { trackInteraction } from '@/src/lib/edge/client';

export function PwaInstallTracker() {
  useEffect(() => {
    // Track when PWA becomes installable
    const handleInstallable = () => {
      trackInteraction({
        content_type: null,
        content_slug: null,
        interaction_type: 'pwa_installable',
        metadata: {
          platform: navigator.platform || 'unknown',
          user_agent: navigator.userAgent,
        },
      }).catch(() => {
        // Analytics failure should not affect UX
      });
    };

    // Track successful installation
    const handleInstalled = () => {
      trackInteraction({
        content_type: null,
        content_slug: null,
        interaction_type: 'pwa_installed',
        metadata: {
          platform: navigator.platform || 'unknown',
          timestamp: new Date().toISOString(),
        },
      }).catch(() => {
        // Analytics failure should not affect UX
      });
    };

    // Track standalone launch (from home screen)
    const handleStandaloneLaunch = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        trackInteraction({
          content_type: null,
          content_slug: null,
          interaction_type: 'pwa_launched',
          metadata: {
            platform: navigator.platform || 'unknown',
            timestamp: new Date().toISOString(),
          },
        }).catch(() => {
          // Analytics failure should not affect UX
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
