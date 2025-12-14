'use client';

/**
 * Newsletter Scroll-Triggered CTA
 * Shows inline CTA when user reaches 60% scroll depth (indicates engagement)
 */

import { type Database } from '@heyclaude/database-types';
import { getNewsletterConfigValue } from '@heyclaude/web-runtime/config/static-configs';
import { logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { ensureNumber } from '@heyclaude/web-runtime/data/utils';
import { SPRING } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { useLoggedAsync, useBoolean, useSessionStorage } from '@heyclaude/web-runtime/hooks';
import { motion, useScroll } from 'motion/react';
import { useEffect, useState } from 'react';

import { NewsletterCTAVariant } from './newsletter-cta-variants';

export interface NewsletterScrollTriggerProps {
  category?: string;
  /**
   * Only show on long-form content (minimum scroll height)
   * @default 500px (from Dynamic Config)
   */
  minScrollHeight?: number;
  source: Database['public']['Enums']['newsletter_source'];
  /**
   * Scroll threshold (0-1) to trigger CTA
   * @default 0.6 (60% of page)
   */
  threshold?: number;
}

export function NewsletterScrollTrigger({
  source,
  category,
  threshold = 0.6,
  minScrollHeight,
}: NewsletterScrollTriggerProps) {
  const { value: isVisible, setTrue: setIsVisibleTrue } = useBoolean();
  const { value: hasTriggered, setTrue: setHasTriggeredTrue } = useBoolean();
  const [scrollHeightThreshold, setScrollHeightThreshold] = useState(minScrollHeight ?? 500);
  const { scrollYProgress } = useScroll();
  const shouldReduceMotion = useReducedMotion();
  
  // Use useSessionStorage hook for scroll trigger state
  const [scrollShown, setScrollShown] = useSessionStorage<string | null>(
    'newsletter-scroll-shown',
    null,
    { initializeWithValue: true }
  );
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
        // Get newsletter config value from static defaults
        const configValue = getNewsletterConfigValue(
          'newsletter.scroll_trigger.min_scroll_height_px'
        );
        // Use ensureNumber to safely validate and fallback to 500 if invalid
        const configHeight = ensureNumber(configValue, 500);
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
    // Check if already shown from sessionStorage
    if (scrollShown === 'true') {
      setHasTriggeredTrue();
      return;
    }
  }, [scrollShown, setHasTriggeredTrue]);

  useEffect(() => {
    // Check if page is long enough for scroll trigger
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (documentHeight < scrollHeightThreshold) {
      return;
    }

    // Listen to scroll progress
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      if (latest >= threshold && !hasTriggered) {
        setIsVisibleTrue();
        setHasTriggeredTrue();
        setScrollShown('true');
      }
    });

    return () => unsubscribe();
  }, [scrollYProgress, threshold, hasTriggered, scrollHeightThreshold, setIsVisibleTrue, setHasTriggeredTrue, setScrollShown]);

  if (!isVisible || hasTriggered) {
    return null;
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={SPRING.smooth}
      className="my-12"
    >
      <NewsletterCTAVariant variant="inline" source={source} {...(category ? { category } : {})} />
    </motion.div>
  );
}
