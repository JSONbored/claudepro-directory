/**
 * Brand panel for auth pages - Large centered branding
 */

'use client';

import { motion } from 'motion/react';
import { marginBottom, muted, weight, size , spaceY , maxWidth, flexDir,
  tracking,
  leading,
  justify,
  alignItems,
  display,
} from '@heyclaude/web-runtime/design-system';
import { HeyClaudeLogo } from '@/src/components/core/layout/brand-logo';

export function AuthBrandPanel() {
  return (
    <div className={`${display.flex} ${maxWidth['2xl']} ${flexDir.col} ${alignItems.start} ${justify.center} ${spaceY.loose}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className={marginBottom.comfortable}>
          <HeyClaudeLogo size="xl" inView={true} duration={1.5} />
        </div>

        <h1 className={`${marginBottom.comfortable} ${weight.bold} ${size['5xl']} ${leading.tight} ${tracking.tight} lg:${size['6xl']}`}>
          The ultimate Claude
          <br />
          configuration resource
        </h1>

        <p className={`${maxWidth.lg} ${muted.lg} lg:${size.xl}`}>
          Discover, share, and bookmark configurations for agents, MCP servers, rules, and more.
        </p>
      </motion.div>
    </div>
  );
}
