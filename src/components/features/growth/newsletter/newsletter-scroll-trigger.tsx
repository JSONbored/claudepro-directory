'use client';

/**
 * Newsletter Scroll-Triggered CTA
 * Shows inline CTA when user reaches 60% scroll depth (indicates engagement)
 */

import { motion, useScroll } from 'motion/react';
import { useEffect, useState } from 'react';
import { useLoggedAsync } from '@/src/hooks/use-logged-async';
import type { NewsletterSource } from '@/src/hooks/use-newsletter';
import { getNewsletterConfig } from '@/src/lib/actions/feature-flags.actions';
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
   * @default 500px (from Dynamic Config)
   */
  minScrollHeight?: number;
}

export function NewsletterScrollTrigger({
  source,
  category,
  threshold = 0.6,
  minScrollHeight,
}: NewsletterScrollTriggerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [scrollHeightThreshold, setScrollHeightThreshold] = useState(minScrollHeight ?? 500);
  const { scrollYProgress } = useScroll();
  const loadScrollConfig = useLoggedAsync({
    scope: 'NewsletterScrollTrigger',
    defaultMessage: 'Failed to load newsletter scroll config',
    defaultLevel: 'warn',
    defaultRethrow: false,
  });

  useEffect(() => {
    if (minScrollHeight !== undefined) {
      setScrollHeightThreshold(minScrollHeight);
      return;
    }

    loadScrollConfig(
      async () => {
        const result = await getNewsletterConfig({});
        if (result?.data) {
          const config = result.data;
          const configHeight = config['newsletter.scroll_trigger.min_scroll_height_px'] as
            | number
            | undefined;
          setScrollHeightThreshold(configHeight ?? 500);
        }
      },
      {
        context: {
          source,
          category,
        },
      }
    );
  }, [category, loadScrollConfig, minScrollHeight, source]);

  useEffect(() => {
    // Check if page is long enough for scroll trigger
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (documentHeight < scrollHeightThreshold) {
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
  }, [scrollYProgress, threshold, hasTriggered, scrollHeightThreshold]);

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
