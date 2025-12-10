'use client';

/**
 * Scroll-Aware TOC Component
 *
 * Shows/hides table of contents based on scroll direction.
 * - Scroll down: TOC hides (save space, focus on content)
 * - Scroll up: TOC shows (navigation aid when reading)
 *
 * Improves content reading experience by providing navigation when needed.
 */

import { motion, AnimatePresence } from 'motion/react';
import { useScrollDirection, cn } from '@heyclaude/web-runtime/ui';
import { SPRING } from '@heyclaude/web-runtime/design-system';
import { useEffect, useState } from 'react';

interface ScrollAwareTocProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollAwareToc({ children, className }: ScrollAwareTocProps) {
  const { isScrollingDown } = useScrollDirection({ threshold: 30 });
  const [hasScrolled, setHasScrolled] = useState(false);

  // Track if user has scrolled at all
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show TOC when scrolling up or at top, hide when scrolling down (only after user has scrolled)
  const shouldShow = !hasScrolled || !isScrollingDown;

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div
          key="toc-visible"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={SPRING.smooth}
          className={cn('lg:sticky lg:top-24', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
