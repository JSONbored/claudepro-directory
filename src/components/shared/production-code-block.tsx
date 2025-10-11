'use client';

/**
 * Production Code Block Component
 *
 * Unified code block with:
 * - Max-height constraint (32rem / 20 lines)
 * - Smooth expand/collapse with Framer Motion
 * - 1-click copy with Sonner toast
 * - Mobile-optimized (48px touch targets)
 * - Custom Claude orange scrollbar styling
 * - Optional line numbers
 * - Optional filename display
 *
 * Server-rendered HTML from Shiki, client interactivity for UX
 */

import { AnimatePresence, domAnimation, LazyMotion, m } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { EventName } from '@/src/lib/analytics/events.config';
import { EVENTS } from '@/src/lib/analytics/events.config';
import { trackEvent } from '@/src/lib/analytics/tracker';
import { Check, ChevronDown, Copy } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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

/**
 * Get content-type-specific copy_code event based on category
 */
function getCopyCodeEvent(category: string): EventName {
  const eventMap: Record<string, EventName> = {
    agents: EVENTS.COPY_CODE_AGENT,
    mcp: EVENTS.COPY_CODE_MCP,
    'mcp-servers': EVENTS.COPY_CODE_MCP,
    commands: EVENTS.COPY_CODE_COMMAND,
    rules: EVENTS.COPY_CODE_RULE,
    hooks: EVENTS.COPY_CODE_HOOK,
    statuslines: EVENTS.COPY_CODE_STATUSLINE,
    guides: EVENTS.COPY_CODE_GUIDE,
    docs: EVENTS.COPY_CODE_GUIDE,
  };

  return eventMap[category] || EVENTS.COPY_CODE_OTHER;
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
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);

      // Track copy event with content-type-specific analytics
      const pathParts = pathname?.split('/').filter(Boolean) || [];
      const category = pathParts[0] || 'unknown';
      const slug = pathParts[1] || 'unknown';
      const eventName = getCopyCodeEvent(category);

      trackEvent(eventName, {
        slug,
        content_length: code.length,
        ...(language && { language }),
      });
    } catch (_err) {
      toast.error('Failed to copy code');
    }
  };

  const maxHeight = `${maxLines * 1.6}rem`; // 1.6rem per line

  return (
    <LazyMotion features={domAnimation} strict>
      <div className={`${UI_CLASSES.CODE_BLOCK_GROUP_WRAPPER} ${className}`}>
        {/* Header with filename, language badge, and copy button */}
        {filename && (
          <div className={UI_CLASSES.CODE_BLOCK_HEADER}>
            <span className={UI_CLASSES.CODE_BLOCK_FILENAME}>{filename}</span>
            <div className="flex items-center gap-2">
              {/* Language badge pill */}
              {language && language !== 'text' && (
                <span className="px-2 py-0.5 text-2xs font-medium uppercase tracking-wider rounded-full bg-accent/10 text-accent border border-accent/20">
                  {language}
                </span>
              )}
              {/* Copy button */}
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-code/30"
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
              </button>
            </div>
          </div>
        )}

        {/* Code block container with Framer Motion smooth animations */}
        <m.div
          ref={preRef}
          className="relative overflow-hidden"
          initial={false}
          animate={{
            height: needsCollapse && !isExpanded ? maxHeight : 'auto',
          }}
          transition={UI_CLASSES.SPRING_SMOOTH}
        >
          {/* Language badge - top right corner */}
          {language && language !== 'text' && !filename && (
            <div className="absolute top-3 right-3 z-20 px-2 py-1 text-2xs font-medium uppercase tracking-wide rounded-md bg-accent/10 text-accent border border-accent/20 backdrop-blur-sm">
              {language}
            </div>
          )}

          {/* Gradient fade when collapsed - with smooth opacity transition */}
          <AnimatePresence>
            {needsCollapse && !isExpanded && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={UI_CLASSES.FADE_IN_OUT}
                className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent 0%, var(--color-bg-code) 90%)',
                }}
              />
            )}
          </AnimatePresence>

          {/* Server-rendered Shiki HTML */}
          <div
            className={showLineNumbers ? 'code-with-line-numbers' : ''}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Server-side Shiki generates trusted HTML
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </m.div>

        {/* Expand/collapse button - shows on hover when collapsed, always visible when expanded */}
        {needsCollapse && (
          <m.button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center justify-center gap-2 w-full py-2 text-sm font-medium transition-all bg-code/30 backdrop-blur-sm border-t border-border/50 ${
              isExpanded
                ? 'opacity-100 text-foreground'
                : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground'
            }`}
            whileHover={UI_CLASSES.SCALE_HOVER}
            whileTap={UI_CLASSES.SCALE_TAP}
            transition={UI_CLASSES.SPRING_BOUNCY}
          >
            <m.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={UI_CLASSES.SPRING_GENTLE}>
              <ChevronDown className="h-4 w-4" />
            </m.div>
            <span className="text-xs">
              {isExpanded ? 'Collapse' : `Expand ${code.split('\n').length} lines`}
            </span>
          </m.button>
        )}

        {/* Copy button (floating, for blocks without filename) */}
        {!(filename || language) && (
          <button
            type="button"
            onClick={handleCopy}
            className={UI_CLASSES.CODE_BLOCK_COPY_BUTTON_FLOATING}
            style={{ minWidth: '48px', minHeight: '48px' }}
            title="Copy code"
          >
            {isCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className={`h-4 w-4 ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`} />
            )}
          </button>
        )}
      </div>
    </LazyMotion>
  );
}
