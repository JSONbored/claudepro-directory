'use client';

/**
 * Production Code Block Component
 *
 * Unified code block with:
 * - Max-height constraint (32rem / 20 lines)
 * - Expand/collapse with CSS Grid animation
 * - 1-click copy with Sonner toast
 * - Mobile-optimized (48px touch targets)
 * - Custom scrollbar styling
 * - Optional line numbers
 * - Optional filename display
 *
 * Server-rendered HTML from Shiki, client interactivity for UX
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Check, ChevronDown, ChevronUp, Copy } from '@/lib/icons';
import { UI_CLASSES } from '@/lib/ui-constants';

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

  // Check if content exceeds maxLines
  useEffect(() => {
    if (preRef.current) {
      const pre = preRef.current.querySelector('pre');
      if (pre) {
        const lines = code.split('\n').length;
        setNeedsCollapse(lines > maxLines);
      }
    }
  }, [code, maxLines]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (_err) {
      toast.error('Failed to copy code');
    }
  };

  const maxHeight = `${maxLines * 1.6}rem`; // 1.6rem per line

  return (
    <div className={`${UI_CLASSES.CODE_BLOCK_GROUP_WRAPPER} ${className}`}>
      {/* Header with filename and copy button */}
      {(filename || language) && (
        <div className={UI_CLASSES.CODE_BLOCK_HEADER}>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            {filename && <span className={UI_CLASSES.CODE_BLOCK_FILENAME}>{filename}</span>}
            {!filename && language && (
              <span className={UI_CLASSES.CODE_BLOCK_LANGUAGE}>{language}</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={UI_CLASSES.CODE_BLOCK_COPY_BUTTON}
            style={{ minWidth: '48px', minHeight: '48px' }}
            title="Copy code"
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className={UI_CLASSES.TEXT_XS}>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.HIDDEN_SM_FLEX}`}>Copy</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Code block container with optional collapse */}
      <div
        ref={preRef}
        className="relative overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: needsCollapse && !isExpanded ? maxHeight : 'none',
        }}
      >
        {/* Gradient fade when collapsed */}
        {needsCollapse && !isExpanded && (
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent, var(--color-bg-card))',
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

      {/* Expand/collapse button */}
      {needsCollapse && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={UI_CLASSES.CODE_BLOCK_EXPAND_BUTTON}
          style={{ minHeight: '48px' }}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              <span>Collapse code</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              <span>Expand to view all {code.split('\n').length} lines</span>
            </>
          )}
        </button>
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
  );
}
