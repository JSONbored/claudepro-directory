'use client';

import { useEffect } from 'react';

// Critical resource preloader for perfect Core Web Vitals
export function PerformanceOptimizer() {
  useEffect(() => {
    // Preload critical fonts for faster text rendering
    const preloadFont = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    };

    // Preload critical images for faster LCP
    const preloadImage = (src: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = src;
      link.as = 'image';
      document.head.appendChild(link);
    };

    // Prefetch critical API routes
    const prefetchAPI = (url: string) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    };

    // Preload critical fonts used across the site
    preloadFont('/fonts/inter-var.woff2');

    // Preload critical hero images
    preloadImage('/hero-image.webp');

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
    const reportWebVitals = (metric: any) => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', metric.name, {
          custom_parameter_1: metric.value,
          custom_parameter_2: metric.label,
          custom_parameter_3: metric.id,
        });
      }
    };

    // Dynamic import to avoid blocking initial load
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(reportWebVitals);
      onFCP(reportWebVitals);
      onLCP(reportWebVitals);
      onTTFB(reportWebVitals);
      onINP(reportWebVitals);
    });
  }, []);

  return null; // This component doesn't render anything
}

// Service Worker registration for caching and offline support
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

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
      /* Critical above-the-fold styles */
      .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: .5; }
      }
      .bg-card\\/50 { background-color: hsl(var(--card) / 0.5); }
      .rounded-lg { border-radius: 0.5rem; }
      .p-6 { padding: 1.5rem; }
      .space-y-4 > * + * { margin-top: 1rem; }
      .h-6 { height: 1.5rem; }
      .h-4 { height: 1rem; }
      .w-3\\/4 { width: 75%; }
      .w-full { width: 100%; }
      .w-2\\/3 { width: 66.666667%; }
    `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.appendChild(style);
  }
}
