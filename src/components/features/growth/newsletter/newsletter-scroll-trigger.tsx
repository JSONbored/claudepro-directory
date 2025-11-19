'use client';

/**
 * Newsletter Scroll-Triggered CTA
 * Shows inline CTA when user reaches 60% scroll depth (indicates engagement)
 */

import { motion, useScroll } from 'motion/react';
import { useEffect, useState } from 'react';
import { useLoggedAsync } from '@/src/hooks/use-logged-async';
import { getNewsletterConfigValue } from '@/src/lib/actions/feature-flags.actions';
import { ensureNumber } from '@/src/lib/utils/data.utils';
import { logUnhandledPromise } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

import { NewsletterCTAVariant } from './newsletter-cta-variants';

export interface NewsletterScrollTriggerProps {
  source: Database['public']['Enums']['newsletter_source'];
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
        const result = await getNewsletterConfigValue({
          key: 'newsletter.scroll_trigger.min_scroll_height_px',
        });
        // getNewsletterConfigValue returns the typed value from defaults
        // Use ensureNumber to safely validate and fallback to 500 if invalid
        const configHeight = ensureNumber(result?.data, 500);
        setScrollHeightThreshold(configHeight);
      },
      {
        context: {
          source,
          category,
        },
      }
    ).catch((error) => {
      logUnhandledPromise('NewsletterScrollTrigger: loadScrollConfig failed', error, {
        source,
        category,
      });
    });
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
