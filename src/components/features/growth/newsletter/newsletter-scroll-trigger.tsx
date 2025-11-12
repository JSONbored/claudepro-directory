'use client';

/**
 * Newsletter Scroll-Triggered CTA
 * Shows inline CTA when user reaches 60% scroll depth (indicates engagement)
 */

import { motion, useScroll } from 'motion/react';
import { useEffect, useState } from 'react';
import type { NewsletterSource } from '@/src/hooks/use-newsletter';
import { NewsletterCTAVariant } from './newsletter-cta-variants';

export interface NewsletterScrollTriggerProps {
  source: NewsletterSource;
  category?: string;
  /**
   * Scroll threshold (0-1) to trigger CTA
   * @default 0.6 (60% of page)
   */
  threshold?: number;
  /**
   * Only show on long-form content (minimum scroll height)
   * @default 2000px
   */
  minScrollHeight?: number;
}

export function NewsletterScrollTrigger({
  source,
  category,
  threshold = 0.6,
  minScrollHeight = 2000,
}: NewsletterScrollTriggerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    // Check if page is long enough for scroll trigger
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (documentHeight < minScrollHeight) {
      return;
    }

    // Check sessionStorage to see if already shown
    const shown = sessionStorage.getItem('newsletter-scroll-shown');
    if (shown === 'true') {
      setHasTriggered(true);
      return;
    }

    // Listen to scroll progress
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      if (latest >= threshold && !hasTriggered) {
        setIsVisible(true);
        setHasTriggered(true);
        sessionStorage.setItem('newsletter-scroll-shown', 'true');
      }
    });

    return () => unsubscribe();
  }, [scrollYProgress, threshold, hasTriggered, minScrollHeight]);

  if (!isVisible || hasTriggered) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1], // Smooth spring
      }}
      className="my-12"
    >
      <NewsletterCTAVariant variant="inline" source={source} {...(category ? { category } : {})} />
    </motion.div>
  );
}
