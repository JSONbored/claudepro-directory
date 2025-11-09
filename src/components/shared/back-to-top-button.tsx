/**
 * Back to Top Button Component
 *
 * Vercel-style scroll-to-top button with Motion.dev animations.
 * Appears after scrolling 300px down the page.
 *
 * Features:
 * - Smooth scroll animation
 * - Motion.dev spring physics
 * - Responsive positioning (upper-right)
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
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
          className={`fixed top-20 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border/50 bg-card/95 text-foreground shadow-black/10 shadow-lg backdrop-blur-md transition-colors duration-200 will-change-transform hover:border-accent/50 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background md:top-24 md:right-12 md:h-12 md:w-12 dark:shadow-black/30 ${className}
          `}
          aria-label="Scroll to top"
        >
          <ArrowUp className={`${UI_CLASSES.ICON_SM} md:h-5 md:w-5`} aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
