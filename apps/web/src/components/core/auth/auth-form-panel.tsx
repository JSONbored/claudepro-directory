/**
 * Auth form panel - Redis-inspired clean design
 */

'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { marginBottom, marginTop, muted, weight , size , gap, justify,
  alignItems,
} from '@heyclaude/web-runtime/design-system';

interface AuthFormPanelProps {
  title?: string;
  description?: string;
  children: ReactNode;
  afterContent?: ReactNode;
}

export function AuthFormPanel({
  title = 'Sign in',
  description = 'Choose your preferred sign-in method',
  children,
  afterContent,
}: AuthFormPanelProps) {
  return (
    <div className="w-full">
      <motion.div
        className={marginBottom.section}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className={`${marginBottom.default} text-center ${weight.bold} ${size['3xl']}`}>{title}</h2>
        <p className={`text-center ${muted.sm}`}>{description}</p>
      </motion.div>

      {/* Icon grid - 3 columns */}
      <motion.div
        className={`flex ${alignItems.center} ${justify.center} ${gap.comfortable}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {children}
      </motion.div>

      {afterContent && (
        <motion.div
          className={marginTop.relaxed}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          {afterContent}
        </motion.div>
      )}
    </div>
  );
}
