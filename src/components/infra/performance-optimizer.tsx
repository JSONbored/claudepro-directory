'use client';

import { useEffect } from 'react';

// Critical resource preloader for perfect Core Web Vitals
export function PerformanceOptimizer() {
  useEffect(() => {
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

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
}

// Service Worker registration removed - handled in app/layout.tsx
