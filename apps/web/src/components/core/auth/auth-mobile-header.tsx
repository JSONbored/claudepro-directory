/**
 * Mobile header for auth pages - condensed HeyClaudeLogo
 */

'use client';

import { cardBody, cluster, marginTop ,size } from '@heyclaude/web-runtime/design-system';
import { motion } from 'motion/react';
import { HeyClaudeLogo } from '@/src/components/core/layout/brand-logo';

/**
 * Mobile header for authentication pages that displays the HeyClaude logo and a compact title.
 *
 * Renders an animated, condensed header intended for mobile layouts with a background styled via the design system.
 *
 * @returns A React element representing the animated mobile auth header.
 *
 * @see HeyClaudeLogo
 * @see cardBody
 * @see motion
 */
export function AuthMobileHeader() {
  return (
    <motion.div
      className={cardBody.default}
      style={{ backgroundColor: 'oklch(74% 0.2 35)' }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={cluster.default}>
        <HeyClaudeLogo size="md" inView={true} duration={1.2} />
      </div>

      <motion.p
        className={`${marginTop.compact} text-white/90 ${size.xs}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Claude Pro Directory
      </motion.p>
    </motion.div>
  );
}