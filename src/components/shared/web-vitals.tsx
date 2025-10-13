'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { EVENTS } from '@/src/lib/analytics/events.config';
import { trackEvent } from '@/src/lib/analytics/tracker';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Track Core Web Vitals to Umami as custom performance events
    // Metrics: CLS, FCP, FID, INP, LCP, TTFB
    const payload: {
      metric: string;
      value: number;
      page?: string;
    } = {
      metric: metric.name,
      value: Math.round(metric.value), // Round to avoid excessive precision
    };

    // Only add page if we're in browser context
    if (typeof window !== 'undefined') {
      payload.page = window.location.pathname;
    }

    trackEvent(EVENTS.PERFORMANCE_METRIC, payload);
  });

  return null;
}
