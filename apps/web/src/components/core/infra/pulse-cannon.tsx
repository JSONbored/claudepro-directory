'use client';

/**
 * Pulse Cannon - Loads all pulse services after page is idle
 * Zero initial bundle impact - all services lazy-loaded
 */

import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

/**
 * CRITICAL: Direct reference to process.env.NODE_ENV
 * Next.js inlines this at build time. Do NOT use dynamic env lookups here!
 * The shared-runtime isProduction uses dynamic lookup which doesn't work client-side.
 */
// eslint-disable-next-line architectural-rules/require-env-validation-schema -- NODE_ENV is inlined by Next.js at build time, not a runtime lookup
const isProduction = process.env.NODE_ENV === 'production';

const VercelPulse = dynamic(
  () =>
    import('@vercel/analytics/next')
      .then((mod) => mod.Analytics)
      .catch((error) => {
        const normalized = normalizeError(error, 'Failed to load Vercel pulse');
        logClientWarn(
          '[Analytics] Vercel pulse import failed',
          normalized,
          'PulseCannon.loadVercelPulse',
          {
            component: 'PulseCannon',
            action: 'load-vercel-pulse',
            category: 'analytics',
            error: normalized.message,
          }
        );
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
        logClientWarn(
          '[Analytics] Speed Insights import failed',
          normalized,
          'PulseCannon.loadSpeedInsights',
          {
            component: 'PulseCannon',
            action: 'load-speed-insights',
            category: 'analytics',
            error: normalized.message,
          }
        );
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
    script.dataset['websiteId'] = 'b734c138-2949-4527-9160-7fe5d0e81121';
    script.setAttribute(
      'integrity',
      'sha384-gW+82edTiLqRoEvPbT3xKDCYZ5M02YXbW4tA3gbojZWiiMYNJZb4YneJrS4ri3Rn'
    );
    script.setAttribute('crossorigin', 'anonymous');
    script.defer = true;
    document.head.append(script);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to inject Umami pulse script');
    logClientWarn(
      '[Analytics] Umami pulse injection failed',
      normalized,
      'PulseCannon.loadUmamiPulse',
      {
        component: 'PulseCannon',
        action: 'load-umami-pulse',
        category: 'analytics',
        error: normalized.message,
      }
    );
  }
}

export function PulseCannon() {
  const [shouldLoadPulse, setShouldLoadPulse] = useState(false);

  useEffect(() => {
    if (!isProduction || shouldLoadPulse) {
      return;
    }

    if (typeof globalThis.window === 'undefined') {
      return;
    }

    const loadAllPulse = () => {
      try {
        loadUmamiPulse();
        setShouldLoadPulse(true);
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to load pulse services');
        logClientWarn(
          '[Analytics] Pulse loading failed',
          normalized,
          'PulseCannon.loadAllPulse',
          {
            component: 'PulseCannon',
            action: 'load-all-pulse',
            category: 'analytics',
            error: normalized.message,
          }
        );
      }
    };

    if ('requestIdleCallback' in globalThis) {
      requestIdleCallback(loadAllPulse, { timeout: 2000 });
    } else if (typeof document !== 'undefined' && document.readyState === 'complete') {
      setTimeout(loadAllPulse, 100);
    } else {
      (globalThis as unknown as Window).addEventListener(
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
