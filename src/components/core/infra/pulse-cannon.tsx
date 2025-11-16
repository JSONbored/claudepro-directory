'use client';

/**
 * Pulse Cannon - Loads all pulse services after page is idle
 * Zero initial bundle impact - all services lazy-loaded
 */

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

const isProduction = process.env.NODE_ENV === 'production';

const VercelPulse = dynamic(
  () =>
    import('@vercel/analytics/next')
      .then((mod) => mod.Analytics)
      .catch((error) => {
        const normalized = normalizeError(error, 'Failed to load Vercel pulse');
        logger.warn('PulseCannon: Vercel pulse import failed', { error: normalized.message });
        return () => null;
      }),
  {
    ssr: false,
  }
);

const SpeedInsights = dynamic(
  () =>
    import('@vercel/speed-insights/next')
      .then((mod) => mod.SpeedInsights)
      .catch((error) => {
        const normalized = normalizeError(error, 'Failed to load Speed Insights');
        logger.warn('PulseCannon: Speed Insights import failed', { error: normalized.message });
        return () => null;
      }),
  {
    ssr: false,
  }
);

function loadUmamiPulse(): void {
  if (!isProduction || document.querySelector('script[data-website-id]')) {
    return;
  }

  try {
    const script = document.createElement('script');
    script.src = 'https://umami.claudepro.directory/script.js';
    script.setAttribute('data-website-id', 'b734c138-2949-4527-9160-7fe5d0e81121');
    script.setAttribute(
      'integrity',
      'sha384-gW+82edTiLqRoEvPbT3xKDCYZ5M02YXbW4tA3gbojZWiiMYNJZb4YneJrS4ri3Rn'
    );
    script.setAttribute('crossorigin', 'anonymous');
    script.defer = true;
    document.head.appendChild(script);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to inject Umami pulse script');
    logger.warn('PulseCannon: Umami pulse injection failed', { error: normalized.message });
  }
}

export function PulseCannon() {
  const [shouldLoadPulse, setShouldLoadPulse] = useState(false);

  useEffect(() => {
    if (!isProduction || shouldLoadPulse) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const loadAllPulse = () => {
      try {
        loadUmamiPulse();
        setShouldLoadPulse(true);
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to load pulse services');
        logger.warn('PulseCannon: Pulse loading failed', { error: normalized.message });
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadAllPulse, { timeout: 2000 });
    } else if (typeof document !== 'undefined' && document.readyState === 'complete') {
      setTimeout(loadAllPulse, 100);
    } else {
      (window as Window).addEventListener(
        'load',
        () => {
          setTimeout(loadAllPulse, 100);
        },
        { once: true }
      );
    }
  }, [shouldLoadPulse]);

  if (!shouldLoadPulse) {
    return null;
  }

  return (
    <>
      <VercelPulse />
      <SpeedInsights />
    </>
  );
}
