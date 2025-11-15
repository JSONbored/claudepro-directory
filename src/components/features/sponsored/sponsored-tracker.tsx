'use client';

/**
 * Sponsored Content Tracker - Secure Server-Side Tracking
 *
 * Tracks impressions (when visible) and clicks for sponsored content.
 * Uses server actions for secure RPC calls.
 *
 * Uses Intersection Observer for visibility detection.
 */

import { useEffect, useRef } from 'react';
import { trackSponsoredClick, trackSponsoredImpression } from '@/src/lib/actions/tracking.actions';
import { logUnhandledPromise } from '@/src/lib/utils/error.utils';

interface SponsoredTrackerProps {
  /** UUID of the sponsored campaign */
  sponsoredId: string;
  /** Position in the feed (0-indexed) */
  position?: number | undefined;
  /** URL of the current page */
  pageUrl?: string | undefined;
  /** Target URL when clicked */
  targetUrl: string;
  /** Children to wrap (usually the card) */
  children: React.ReactNode;
}

export function SponsoredTracker({
  sponsoredId,
  position,
  pageUrl,
  targetUrl,
  children,
}: SponsoredTrackerProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const impressionTracked = useRef(false);

  // Track impression when element becomes visible
  useEffect(() => {
    const element = elementRef.current;
    if (!element || impressionTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !impressionTracked.current) {
          impressionTracked.current = true;

          // Fire-and-forget impression tracking via server action
          trackSponsoredImpression({
            sponsoredId,
            pageUrl: pageUrl || (typeof window !== 'undefined' ? window.location.pathname : ''),
            position: position ?? 0,
          }).catch((error) => {
            logUnhandledPromise('SponsoredTracker: impression failed', error, {
              sponsoredId,
              position: position ?? 0,
            });
          });
        }
      },
      {
        threshold: 0.5, // 50% visible
        rootMargin: '0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [sponsoredId, pageUrl, position]);

  // Track click when user interacts with children (via event delegation)
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleClick = () => {
      // Fire-and-forget click tracking via server action
      trackSponsoredClick({
        sponsoredId,
        targetUrl,
      }).catch((error) => {
        logUnhandledPromise('SponsoredTracker: click failed', error, { sponsoredId });
      });
    };

    // Use capture phase to track clicks on any child elements
    element.addEventListener('click', handleClick, { capture: true });

    return () => {
      element.removeEventListener('click', handleClick, { capture: true });
    };
  }, [sponsoredId, targetUrl]);

  return <div ref={elementRef}>{children}</div>;
}
