/**
 * Mobile header for auth pages - condensed HeyClaudeLogo
 */

'use client';

import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { STAGGER, DURATION } from '@heyclaude/web-runtime/design-system';
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
 * @see UI_CLASSES.CARD_BODY_SPACING
 */
export function AuthMobileHeader() {
  return (
    <motion.div
      className={UI_CLASSES.CARD_BODY_SPACING}
      style={{ backgroundColor: 'oklch(74% 0.2 35)' }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.moderate }}
    >
      <div className="flex items-center gap-3">
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