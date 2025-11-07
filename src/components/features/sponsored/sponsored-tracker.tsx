'use client';

/**
 * Sponsored Content Tracker - Database-First
 *
 * Tracks impressions (when visible) and clicks for sponsored content.
 * Direct Supabase RPC calls - no server action wrapper.
 *
 * Uses Intersection Observer for visibility detection.
 */

import { useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/src/lib/supabase/client';

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
  const supabase = useMemo(() => createClient(), []);

  // Track impression when element becomes visible
  useEffect(() => {
    const element = elementRef.current;
    if (!element || impressionTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !impressionTracked.current) {
          impressionTracked.current = true;

          // Fire-and-forget impression tracking via direct RPC
          supabase
            .rpc('track_sponsored_event', {
              p_event_type: 'impression',
              p_user_id: '',
              p_data: {
                sponsored_id: sponsoredId,
                page_url:
                  pageUrl || (typeof window !== 'undefined' ? window.location.pathname : ''),
                position: position ?? 0,
              },
            })
            .then(
              () => {
                // Success - do nothing
              },
              () => {
                // Silent fail - impressions are best-effort
              }
            );
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
  }, [sponsoredId, pageUrl, position, supabase]);

  // Track click when user interacts with children (via event delegation)
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleClick = () => {
      // Fire-and-forget click tracking via direct RPC
      supabase
        .rpc('track_sponsored_event', {
          p_event_type: 'click',
          p_user_id: '',
          p_data: {
            sponsored_id: sponsoredId,
            target_url: targetUrl,
          },
        })
        .then(
          () => {
            // Success - do nothing
          },
          () => {
            // Silent fail - clicks are best-effort
          }
        );
    };

    // Use capture phase to track clicks on any child elements
    element.addEventListener('click', handleClick, { capture: true });

    return () => {
      element.removeEventListener('click', handleClick, { capture: true });
    };
  }, [sponsoredId, targetUrl, supabase]);

  return <div ref={elementRef}>{children}</div>;
}
