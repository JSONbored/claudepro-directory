/**
 * Mobile header for auth pages - condensed HeyClaudeLogo
 */

'use client';

import { STAGGER, DURATION } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';

import { HeyClaudeLogo } from '@/src/components/core/layout/brand-logo';

/**
 * Compact mobile header that displays the HeyClaude brand logo and a subtitle with simple entrance animations.
 *
 * Renders a card-styled container containing the HeyClaudeLogo and a small caption ("Claude Pro Directory"); the container and caption animate into view on mount.
 *
 * @returns The JSX element for the mobile authentication header.
 *
 * @see HeyClaudeLogo
 */
export function AuthMobileHeader() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      className="bg-color-accent-primary p-6"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: DURATION.moderate }}
    >
      <div className="flex items-center gap-2">
        <HeyClaudeLogo size="md" inView duration={1.2} />
      </div>

      <motion.p
        className="mt-2 text-xs text-white/90"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.moderate, delay: STAGGER.default }}
      >
        Claude Pro Directory
      </motion.p>
    </motion.div>
  );
}
