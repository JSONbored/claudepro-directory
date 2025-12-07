/**
 * Auth form panel - Redis-inspired clean design
 */

'use client';

import { motion } from 'motion/react';
import { type ReactNode } from 'react';

interface AuthFormPanelProps {
  afterContent?: ReactNode;
  children: ReactNode;
  description?: string;
  title?: string;
}

/**
 * Render an animated authentication panel with a heading, descriptive text, an icon grid for sign-in options, and optional trailing content.
 *
 * @param title - Heading text displayed above the sign-in options; defaults to `'Sign in'`.
 * @param description - Supporting text shown under the heading; defaults to `'Choose your preferred sign-in method'`.
 * @param children - Elements rendered within the centered icon grid (sign-in option buttons or icons).
 * @param afterContent - Optional content rendered below the icon grid (e.g., links or secondary actions).
 * @returns A JSX element containing the fully composed, animated auth panel.
 *
 * @see AuthFormPanelProps
 */
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
        <h2 className="mb-4 text-center text-3xl font-bold">{title}</h2>
        <p className="text-muted-foreground text-center text-sm">{description}</p>
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

      {afterContent ? (
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          {afterContent}
        </motion.div>
      ) : null}
    </div>
  );
}