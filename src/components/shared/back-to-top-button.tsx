/**
 * Back to Top Button Component
 *
 * Vercel-style scroll-to-top button with Motion.dev animations.
 * Appears after scrolling 300px down the page.
 *
 * Features:
 * - Smooth scroll animation
 * - Motion.dev spring physics
 * - Responsive positioning (bottom-right)
 * - WCAG 2.1 AA compliant (44x44px touch target)
 * - Performance optimized (rAF throttling, passive listeners)
 *
 * Accessibility:
 * - Keyboard navigation (Tab, Enter, Space)
 * - Screen reader support (aria-label)
 * - Focus visible styles
 *
 * @module components/shared/back-to-top-button
 */

'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ArrowUp } from '@/src/lib/icons';

interface BackToTopButtonProps {
  /**
   * Scroll position threshold to show button (px)
   * @default 300
   */
  threshold?: number;

  /**
   * Custom className for styling
   */
  className?: string;
}

export function BackToTopButton({ threshold = 300, className = '' }: BackToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Optimized scroll handler with rAF throttling
  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      // Cancel pending frame to debounce
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      // Schedule update for next animation frame
      rafId = requestAnimationFrame(() => {
        const scrolled = window.scrollY > threshold;
        // Only update state when crossing threshold (prevents re-render on every pixel)
        setIsVisible((prev) => (prev !== scrolled ? scrolled : prev));
      });
    };

    // Check initial scroll position
    handleScroll();

    // Passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [threshold]);

  // Smooth scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.button
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 17,
          }}
          className={`
            fixed bottom-6 right-6 md:bottom-12 md:right-12 z-40
            h-11 w-11 md:h-12 md:w-12
            rounded-full
            bg-card/95 backdrop-blur-md
            border border-border/50
            shadow-lg shadow-black/10 dark:shadow-black/30
            flex items-center justify-center
            text-foreground
            hover:bg-accent hover:text-accent-foreground hover:border-accent/50
            focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background
            transition-colors duration-200
            will-change-transform
            ${className}
          `}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
