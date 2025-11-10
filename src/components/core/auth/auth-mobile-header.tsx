/**
 * Mobile header for auth pages - condensed HeyClaudeLogo
 */

'use client';

import { motion } from 'motion/react';
import { HeyClaudeLogo } from '@/src/components/core/layout/heyclaude-logo';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export function AuthMobileHeader() {
  return (
    <motion.div
      className={UI_CLASSES.CARD_BODY_SPACING}
      style={{ backgroundColor: 'oklch(74% 0.2 35)' }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3">
        <HeyClaudeLogo size="md" inView={true} duration={1.2} />
      </div>

      <motion.p
        className="mt-2 text-white/90 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Claude Desktop Directory
      </motion.p>
    </motion.div>
  );
}
