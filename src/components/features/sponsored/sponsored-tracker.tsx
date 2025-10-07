'use client';

/**
 * Sponsored Content Tracker
 * 
 * Tracks impressions (when visible) and clicks for sponsored content.
 * Only renders when item is actually sponsored - no-op otherwise.
 * 
 * Uses Intersection Observer for visibility detection.
 */

import { useEffect, useRef } from 'react';
import { trackSponsoredClick, trackSponsoredImpression } from '@/src/lib/actions/sponsored-actions';

interface SponsoredTrackerProps {
  /** UUID of the sponsored campaign */
  sponsoredId: string;
  /** Position in the feed (0-indexed) */
  position?: number;
  /** URL of the current page */
  pageUrl?: string;
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

          // Fire-and-forget impression tracking
          trackSponsoredImpression({
            sponsored_id: sponsoredId,
            page_url: pageUrl || (typeof window !== 'undefined' ? window.location.pathname : ''),
            position: position ?? 0,
          }).catch(() => {
            // Silent fail - impressions are best-effort
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

  // Track click when user interacts
  const handleClick = () => {
    // Fire-and-forget click tracking
    trackSponsoredClick({
      sponsored_id: sponsoredId,
      target_url: targetUrl,
    }).catch(() => {
      // Silent fail - clicks are best-effort
    });
  };

  return (
    <div ref={elementRef} onClick={handleClick}>
      {children}
    </div>
  );
}
