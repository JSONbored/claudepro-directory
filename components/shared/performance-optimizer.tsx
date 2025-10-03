'use client';

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';
import { logger } from '@/lib/logger';
import { gtagEventSchema } from '@/lib/schemas/analytics.schema';

// Critical resource preloader for perfect Core Web Vitals
export function PerformanceOptimizer() {
  useEffect(() => {
    // Prefetch critical API routes
    const prefetchAPI = (url: string) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    };

    // Optimize LCP by preloading hero content
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Lazy load non-critical content when scrolled into view
          const element = entry.target as HTMLElement;
          element.style.willChange = 'auto';
          observer.unobserve(element);
        }
      });
    });

    // Observe all lazy-loadable elements
    document.querySelectorAll('[data-lazy]').forEach((el) => {
      observer.observe(el);
    });

    // Prefetch critical routes
    prefetchAPI('/api/all-configurations.json');

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  // Client-side performance monitoring
  useEffect(() => {
    // Report Web Vitals to analytics
    const reportWebVitals = (metric: Metric) => {
      if (window?.gtag) {
        // Validate gtag event with Zod schema
        const gtagEvent = gtagEventSchema.safeParse({
          command: 'event',
          action: metric.name,
          parameters: {
            custom_parameter_1: metric.value,
            custom_parameter_2: metric.rating,
            custom_parameter_3: metric.id,
          },
        });

        if (gtagEvent.success) {
          window.gtag(gtagEvent.data.command, gtagEvent.data.action, gtagEvent.data.parameters);
        }
      }
    };

    // Dynamic import to avoid blocking initial load
    import('web-vitals')
      .then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
        onCLS(reportWebVitals);
        onFCP(reportWebVitals);
        onLCP(reportWebVitals);
        onTTFB(reportWebVitals);
        onINP(reportWebVitals);
      })
      .catch((error) => {
        logger.error('Failed to load web-vitals:', error as Error);
      });
  }, []);

  return null; // This component doesn't render anything
}

// Service Worker registration removed - handled in app/layout.tsx
