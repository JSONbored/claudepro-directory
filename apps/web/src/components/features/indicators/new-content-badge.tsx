'use client';

/**
 * New Content Badge Component
 *
 * A badge that shows either "Production Ready" or "X new since last visit"
 * depending on whether there's new content.
 *
 * Used in category page hero sections as a badge replacement.
 *
 * @module features/indicators/new-content-badge
 */

import { iconLeading } from '@heyclaude/web-runtime/design-system';
import { Sparkles, Shield } from '@heyclaude/web-runtime/icons';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { motion, AnimatePresence } from 'motion/react';
import { useMemo } from 'react';
import { useLastVisit } from './last-visit';

interface NewContentBadgeProps {
  /** Items to check for new content */
  items: Array<{ date_added?: string | null; updated_at?: string | null }>;
  /** Fallback text when nothing is new */
  fallbackText?: string;
}

/**
 * Badge that shows new content count or falls back to default text
 */
export function NewContentBadge({
  items,
  fallbackText = 'Production Ready',
}: NewContentBadgeProps) {
  const { countNewItems } = useLastVisit();
  const newCount = useMemo(() => countNewItems(items), [countNewItems, items]);

  return (
    <AnimatePresence mode="wait">
      {newCount > 0 ? (
        <motion.div
          key="new"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <UnifiedBadge
            variant="base"
            style="outline"
            className="border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400"
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className={iconLeading.xs} aria-hidden="true" />
            </motion.span>
            {newCount} New
          </UnifiedBadge>
        </motion.div>
      ) : (
        <motion.div
          key="fallback"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <UnifiedBadge variant="base" style="outline">
            <Shield className={iconLeading.xs} aria-hidden="true" />
            {fallbackText}
          </UnifiedBadge>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
