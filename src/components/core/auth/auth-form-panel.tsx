/**
 * Auth form panel - Redis-inspired clean design
 */

'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

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
        className="mb-12"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="mb-4 text-center font-bold text-3xl">{title}</h2>
        <p className="text-center text-muted-foreground text-sm">{description}</p>
      </motion.div>

      {/* Icon grid - 3 columns */}
      <motion.div
        className="flex items-center justify-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {children}
      </motion.div>

      {afterContent && (
        <motion.div
          className="mt-8"
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
