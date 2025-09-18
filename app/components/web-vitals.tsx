'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(metric);
    }

    // In production, you could send to analytics service
    // Example with Google Analytics (if configured)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as any).gtag;
      gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Or send to custom endpoint
    if (process.env.NODE_ENV === 'production') {
      const body = JSON.stringify({
        metric: metric.name,
        value: metric.value,
        id: metric.id,
        url: window.location.href,
      });

      // Use sendBeacon for reliability
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics', body);
      }
    }
  });

  return null;
}
