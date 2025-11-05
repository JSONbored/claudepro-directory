/**
 * Auth form panel - OAuth buttons + terms footer
 */

'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthFormPanelProps {
  title?: string;
  description?: string;
  children: ReactNode;
}

export function AuthFormPanel({
  title = 'Welcome back',
  description = 'Sign in to bookmark configurations and join the community',
  children,
}: AuthFormPanelProps) {
  return (
    <div className="px-6 py-8 sm:px-8 lg:px-12">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h1 className="mb-3 font-semibold text-2xl text-foreground sm:text-3xl">{title}</h1>
        <p className="text-base text-muted-foreground">{description}</p>
      </motion.div>

      <motion.div
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {children}
      </motion.div>

      <motion.p
        className="mt-8 text-center text-muted-foreground text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        By continuing, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
      </motion.p>
    </div>
  );
}
