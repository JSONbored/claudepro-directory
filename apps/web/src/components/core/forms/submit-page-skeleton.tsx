'use client';

/**
 * Submit Page Skeleton
 * 
 * Perfectly matches /submit structure:
 * - Hero section (with stats badges)
 * - Two-column layout: Form (left) + Sidebar (right)
 * - Sidebar: ContentSidebar + SubmitPageSidebar
 */

import { SPRING } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { SubmitPageHeroSkeleton } from './submit-page-hero-skeleton';
import { SubmitPageSidebarSkeleton } from './submit-page-sidebar-skeleton';
import { ContentSidebar } from '@/src/components/core/layout/content-sidebar';
import SubmitFormLoading from '@/src/app/submit/loading-form';

/**
 * Submit page skeleton matching exact layout
 */
export function SubmitPageSkeleton() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="container mx-auto max-w-7xl px-4 py-8 sm:py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Hero Header */}
      <motion.div
        initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <SubmitPageHeroSkeleton />
      </motion.div>

      {/* Two-column layout: Form + Sidebar */}
      <motion.div
        className="grid items-start gap-6 lg:grid-cols-[2fr_1fr] lg:gap-8"
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.2 }}
      >
        {/* Form Section (Left) */}
        <motion.div
          className="w-full min-w-0"
          initial={!prefersReducedMotion ? { opacity: 0, x: -20 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
          transition={{ ...SPRING.smooth, delay: 0.3 }}
        >
          <SubmitFormLoading />
        </motion.div>

        {/* Sidebar (Right) */}
        <motion.div
          className="w-full space-y-4 sm:space-y-6 lg:sticky lg:top-24 lg:h-fit"
          initial={!prefersReducedMotion ? { opacity: 0, x: 20 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
          transition={{ ...SPRING.smooth, delay: 0.4 }}
        >
          {/* ContentSidebar */}
          <ContentSidebar />

          {/* Submit page-specific sidebar */}
          <SubmitPageSidebarSkeleton />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
