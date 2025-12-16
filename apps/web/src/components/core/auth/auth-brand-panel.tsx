/**
 * Brand panel for auth pages - Large centered branding
 */

'use client';

import { STAGGER, DURATION, spaceY, marginBottom, muted } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';

import { HeyClaudeLogo } from '@/src/components/core/layout/brand-logo';

/**
 * Renders the branded header panel with an animated logo, main title, and descriptive subtitle for authentication pages.
 *
 * @returns The JSX element containing an animated logo (HeyClaudeLogo), a large heading, and a descriptive paragraph.
 * @see ./brand-logo#HeyClaudeLogo
 */
export function AuthBrandPanel() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div className={`flex max-w-2xl flex-col items-start justify-center ${spaceY.loose}`}>
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: DURATION.extended, delay: STAGGER.default }}
      >
        <div className={`${marginBottom.comfortable}`}>
          <HeyClaudeLogo size="xl" inView duration={1.5} />
        </div>

        <h1 className={`${marginBottom.comfortable} text-5xl leading-tight font-bold tracking-tight lg:text-6xl`}>
          The ultimate Claude
          <br />
          configuration resource
        </h1>

        <p className={`${muted.default} max-w-lg text-lg lg:text-xl`}>
          Discover, share, and bookmark configurations for agents, MCP servers, rules, and more.
        </p>
      </motion.div>
    </div>
  );
}