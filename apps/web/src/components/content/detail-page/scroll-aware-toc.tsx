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

import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import { AnimatePresence } from '@heyclaude/web-runtime/ui';
import { useScrollDirection, cn } from '@heyclaude/web-runtime/ui';
import { SPRING } from '@heyclaude/web-runtime/design-system';
import { useBoolean } from '@heyclaude/web-runtime/hooks';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';

interface ScrollAwareTocProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollAwareToc({ children, className }: ScrollAwareTocProps) {
  const { isScrollingDown } = useScrollDirection({ threshold: 30 });
  const { value: hasScrolled, setValue: setHasScrolled } = useBoolean();
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Track if user has scrolled at all using Motion.dev scroll utilities
  useMotionValueEvent(scrollY, 'change', (current) => {
    setHasScrolled(current > 100);
  });

  // Show TOC when scrolling up or at top, hide when scrolling down (only after user has scrolled)
  const shouldShow = !hasScrolled || !isScrollingDown;

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div
          key="toc-visible"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
          transition={SPRING.smooth}
          className={cn('lg:sticky lg:top-24', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
