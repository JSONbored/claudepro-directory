/**
 * PWA Installation Tracking Hook
 * Tracks PWA installation prompts and successful installations
 */

'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Track when installation prompt is available
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);

      // Track that prompt was shown
      if (window.umami) {
        window.umami.track('pwa_install_prompt_available', {
          page: window.location.pathname,
        });
      }
    };

    // Track successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);

      // Track successful installation
      if (window.umami) {
        window.umami.track('pwa_installed', {
          page: window.location.pathname,
          method: 'browser_prompt',
        });
      }
    };

    // Track iOS manual installation instructions shown
    const trackIOSInstructions = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS && !window.matchMedia('(display-mode: standalone)').matches) {
        if (window.umami) {
          window.umami.track('pwa_ios_instructions_shown', {
            page: window.location.pathname,
          });
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check for iOS
    trackIOSInstructions();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.log('Install prompt not available');
      return false;
    }

    // Track that user clicked install
    if (window.umami) {
      window.umami.track('pwa_install_clicked', {
        page: window.location.pathname,
      });
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    // Track the outcome
    if (window.umami) {
      window.umami.track('pwa_install_outcome', {
        outcome,
        page: window.location.pathname,
      });
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setIsInstallable(false);

    return outcome === 'accepted';
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
}
