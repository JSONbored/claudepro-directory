/**
 * Web Vitals Reporting
 * 
 * Reports Core Web Vitals metrics to console and can be extended to send to analytics.
 * This provides real-time performance monitoring in production.
 * 
 * @see https://web.dev/vitals/
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

/**
 * Report Web Vitals to console and analytics
 * 
 * In production, you can extend this to send metrics to your analytics service.
 */
function reportMetric(metric: Metric) {
  // Log to console for development/debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    });
  }

  // TODO: Send to analytics service (e.g., Vercel Analytics, custom endpoint)
  // Example:
  // if (typeof window !== 'undefined' && window.gtag) {
  //   window.gtag('event', metric.name, {
  //     value: Math.round(metric.value),
  //     metric_id: metric.id,
  //     metric_value: metric.value,
  //     metric_delta: metric.delta,
  //   });
  // }
}

/**
 * Initialize Web Vitals reporting
 * 
 * Call this function in your app layout or _app.tsx to start tracking Core Web Vitals.
 * 
 * @example
 * ```tsx
 * // In app/layout.tsx
 * if (typeof window !== 'undefined') {
 *   import('./lib/analytics/web-vitals').then(({ reportWebVitals }) => {
 *     reportWebVitals();
 *   });
 * }
 * ```
 */
export function reportWebVitals() {
  // Only run in browser
  if (typeof window === 'undefined') {
    return;
  }

  // Core Web Vitals (LCP, INP, CLS)
  onLCP(reportMetric);
  onINP(reportMetric); // Interaction to Next Paint (replaces deprecated FID)
  onCLS(reportMetric);

  // Additional metrics
  onFCP(reportMetric); // First Contentful Paint
  onTTFB(reportMetric); // Time to First Byte
}
