'use client';

/**
 * Production Code Block Component
 *
 * Unified code block with:
 * - Max-height constraint (32rem / 20 lines)
 * - Smooth expand/collapse with CSS transitions (5-10 KB saved vs Framer Motion)
 * - 1-click copy with Sonner toast
 * - Mobile-optimized (48px touch targets)
 * - Custom Claude orange scrollbar styling
 * - Optional line numbers
 * - Optional filename display
 *
 * Server-rendered HTML from Shiki, client interactivity for UX
 */

import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Copy } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { toasts } from '@/src/lib/utils/toast.utils';

export interface ProductionCodeBlockProps {
  /** Pre-rendered HTML from Shiki (server-side) */
  html: string;
  /** Raw code for copy functionality */
  code: string;
  /** Programming language (for display) */
  language?: string | undefined;
  /** Optional filename to display */
  filename?: string | undefined;
  /** Maximum visible lines before collapsing (default: 20) */
  maxLines?: number | undefined;
  /** Show line numbers (default: false) */
  showLineNumbers?: boolean | undefined;
  /** Additional CSS classes */
  className?: string | undefined;
}

export function ProductionCodeBlock({
  html,
  code,
  language = 'text',
  filename,
  maxLines = 20,
  showLineNumbers = false,
  className = '',
}: ProductionCodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const preRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Check if content exceeds maxLines (no DOM access needed - calculate from code prop)
  useEffect(() => {
    const lines = code.split('\n').length;
    setNeedsCollapse(lines > maxLines);
  }, [code, maxLines]);

  const handleCopy = async () => {
    // OPTIMISTIC UI: Update state immediately
    setIsCopied(true);

    try {
      await navigator.clipboard.writeText(code);
      toasts.success.codeCopied();

      // Track copy event (fire-and-forget)
      const pathParts = pathname?.split('/').filter(Boolean) || [];
      const category = pathParts[0] || 'unknown';
      const slug = pathParts[1] || 'unknown';

      Promise.all([import('#lib/analytics/event-mapper'), import('#lib/analytics/tracker')])
        .then(([eventMapper, tracker]) => {
          const eventName = eventMapper.getCopyCodeEvent(category);
          tracker.trackEvent(eventName, {
            slug,
            content_length: code.length,
            ...(language && { language }),
          });
        })
        .catch((err) => {
          if (process.env.NODE_ENV === 'production') {
            logger.error('Analytics tracking failed in ProductionCodeBlock', err as Error);
          }
        });
    } catch (_err) {
      // ROLLBACK on error
      setIsCopied(false);
      toasts.error.copyFailed('code');
      return;
    }

    // Reset after 2s
    setTimeout(() => setIsCopied(false), 2000);
  };

  const maxHeight = `${maxLines * 1.6}rem`; // 1.6rem per line

  return (
    <div className={`${UI_CLASSES.CODE_BLOCK_GROUP_WRAPPER} ${className}`}>
      {/* Header with filename, language badge, and copy button */}
      {filename && (
        <div className={UI_CLASSES.CODE_BLOCK_HEADER}>
          <span className={UI_CLASSES.CODE_BLOCK_FILENAME}>{filename}</span>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            {/* Language badge pill */}
            {language && language !== 'text' && (
              <span className="px-2 py-0.5 text-2xs font-medium uppercase tracking-wider rounded-full bg-accent/10 text-accent border border-accent/20">
                {language}
              </span>
            )}
            {/* Copy button with pulse animation */}
            <motion.button
              type="button"
              onClick={handleCopy}
              animate={isCopied ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5} px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-code/30`}
              title="Copy code"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}

      {/* Code block container with CSS transitions (5-10 KB saved from bundle) */}
      <div
        ref={preRef}
        className="relative overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{
          height: needsCollapse && !isExpanded ? maxHeight : 'auto',
        }}
      >
        {/* Language badge - top right corner */}
        {language && language !== 'text' && !filename && (
          <div className="absolute top-3 right-3 z-20 px-2 py-1 text-2xs font-medium uppercase tracking-wide rounded-md bg-accent/10 text-accent border border-accent/20 backdrop-blur-sm">
            {language}
          </div>
        )}

        {/* Gradient fade when collapsed - with smooth CSS transition */}
        {needsCollapse && !isExpanded && (
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10 transition-opacity duration-200"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, var(--color-bg-code) 90%)',
            }}
          />
        )}

        {/* Server-rendered Shiki HTML */}
        <div
          className={showLineNumbers ? 'code-with-line-numbers' : ''}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Server-side Shiki generates trusted HTML
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {/* Expand/collapse button - shows on hover when collapsed, always visible when expanded */}
      {needsCollapse && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center justify-center gap-2 w-full py-2 text-sm font-medium transition-all hover:scale-105 bg-code/30 backdrop-blur-sm border-t border-border/50 ${
            isExpanded
              ? 'opacity-100 text-foreground'
              : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground'
          }`}
        >
          <div
            className="transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <ChevronDown className="h-4 w-4" />
          </div>
          <span className="text-xs">
            {isExpanded ? 'Collapse' : `Expand ${code.split('\n').length} lines`}
          </span>
        </button>
      )}

      {/* Copy button (floating, for blocks without filename) */}
      {!(filename || language) && (
        <motion.button
          type="button"
          onClick={handleCopy}
          animate={isCopied ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
          className={UI_CLASSES.CODE_BLOCK_COPY_BUTTON_FLOATING}
          style={{ minWidth: '48px', minHeight: '48px' }}
          title="Copy code"
        >
          {isCopied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className={'h-4 w-4 text-muted-foreground'} />
          )}
        </motion.button>
      )}
    </div>
  );
}
