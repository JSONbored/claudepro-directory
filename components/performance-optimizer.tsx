'use client';

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';
import { logger } from '@/lib/logger';
import { gtagEventSchema } from '@/lib/schemas';

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

// Prefetch critical routes for instant navigation
export function prefetchCriticalRoutes() {
  if (typeof window !== 'undefined') {
    const routes = ['/rules', '/mcp', '/agents', '/commands', '/hooks'];

    // Use requestIdleCallback for non-blocking prefetch
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        routes.forEach((route) => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = route;
          document.head.appendChild(link);
        });
      });
    }
  }
}

// Critical CSS injection for above-the-fold content
export function injectCriticalCSS() {
  if (typeof window !== 'undefined') {
    const criticalCSS = `
      /* Critical above-the-fold styles to prevent CLS */
      :root {
        --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        --font-mono: 'JetBrains Mono', ui-monospace, monospace;
      }

      /* Prevent layout shift for hero sections */
      .min-h-screen { min-height: 100vh; }
      .container { width: 100%; margin: 0 auto; padding: 0 1rem; }
      @media (min-width: 640px) { .container { max-width: 640px; } }
      @media (min-width: 768px) { .container { max-width: 768px; } }
      @media (min-width: 1024px) { .container { max-width: 1024px; } }
      @media (min-width: 1280px) { .container { max-width: 1280px; } }

      /* Critical text styles to prevent FOUT */
      .text-5xl { font-size: 3rem; line-height: 1; }
      .text-7xl { font-size: 4.5rem; line-height: 1; }
      .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
      .font-bold { font-weight: 700; }
      .text-center { text-align: center; }

      /* Critical layout styles */
      .grid { display: grid; }
      .flex { display: flex; }
      .gap-6 { gap: 1.5rem; }
      .py-20 { padding-top: 5rem; padding-bottom: 5rem; }
      .mb-6 { margin-bottom: 1.5rem; }
      .mb-8 { margin-bottom: 2rem; }
      .max-w-4xl { max-width: 56rem; }
      .mx-auto { margin-left: auto; margin-right: auto; }

      /* Skeleton loading styles */
      .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: .5; }
      }

      /* Prevent CLS for cards and buttons */
      .bg-card\\/50 { background-color: hsl(var(--card) / 0.5); }
      .rounded-lg { border-radius: 0.5rem; }
      .rounded-xl { border-radius: 0.75rem; }
      .p-6 { padding: 1.5rem; }
      .space-y-4 > * + * { margin-top: 1rem; }
      .h-6 { height: 1.5rem; }
      .h-4 { height: 1rem; }
      .w-3\\/4 { width: 75%; }
      .w-full { width: 100%; }
      .w-2\\/3 { width: 66.666667%; }

      /* Aspect ratios to prevent image CLS */
      .aspect-video { aspect-ratio: 16/9; }
      .aspect-square { aspect-ratio: 1/1; }

      /* Button styles to prevent reflow */
      button { cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }

      /* Prevent FOUC */
      html { visibility: visible !important; }
    `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    style.setAttribute('data-critical', 'true');
    document.head.insertBefore(style, document.head.firstChild);
  }
}
