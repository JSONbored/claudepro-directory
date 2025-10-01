/**
 * Code Highlight Component with Lazy-Loaded Shiki
 *
 * Optimizations applied:
 * - Shiki lazy-loaded only when rendering code blocks (-250KB initial bundle)
 * - Fine-grained language bundles (load only needed languages)
 * - JavaScript regex engine (smaller than WASM, -100KB)
 * - Singleton highlighter instance (reuse for performance)
 * - Loading skeleton for better UX
 *
 * @see https://shiki.style/guide/best-performance
 */

import { memo, useEffect, useState } from 'react';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Check, Copy } from '@/lib/icons';
import { logger } from '@/lib/logger';
import type { CodeHighlightProps } from '@/lib/schemas/component.schema';
import { highlightedCodeSafeSchema } from '@/lib/schemas/form.schema';
import { UI_CLASSES } from '@/lib/ui-constants';

// Lazy-load Shiki with fine-grained bundles
let highlighterPromise: Promise<Awaited<ReturnType<typeof createHighlighter>>> | null = null;

async function createHighlighter() {
  const { createHighlighterCore } = await import('shiki/core');
  const { createJavaScriptRegexEngine } = await import('shiki/engine/javascript');

  // Import only commonly used languages (add more as needed)
  const [oneDarkPro, typescript, javascript, json, bash, python, markdown, jsx, tsx] =
    await Promise.all([
      import('shiki/themes/one-dark-pro.mjs'),
      import('shiki/langs/typescript.mjs'),
      import('shiki/langs/javascript.mjs'),
      import('shiki/langs/json.mjs'),
      import('shiki/langs/bash.mjs'),
      import('shiki/langs/python.mjs'),
      import('shiki/langs/markdown.mjs'),
      import('shiki/langs/jsx.mjs'),
      import('shiki/langs/tsx.mjs'),
    ]);

  return createHighlighterCore({
    themes: [oneDarkPro.default],
    langs: [
      typescript.default,
      javascript.default,
      json.default,
      bash.default,
      python.default,
      markdown.default,
      jsx.default,
      tsx.default,
    ],
    engine: createJavaScriptRegexEngine(),
  });
}

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter();
  }
  return highlighterPromise;
}

// CodeHighlightProps is now imported from component.schema.ts

/**
 * CodeHighlight Component (Memoized)
 *
 * Heavy component with expensive Shiki syntax highlighting.
 * Memoized to prevent unnecessary re-renders when parent re-renders.
 */
const CodeHighlightComponent = ({
  code,
  language = 'typescript',
  title,
  showCopy = true,
}: CodeHighlightProps) => {
  const { copied, copy } = useCopyToClipboard({
    context: {
      component: 'CodeHighlight',
      action: 'copy-code',
    },
  });
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const highlightCode = async () => {
      setIsLoading(true);
      try {
        // Lazy-load Shiki highlighter
        const highlighter = await getHighlighter();

        // Highlight code with lazy-loaded instance
        const html = highlighter.codeToHtml(code, {
          lang: language,
          theme: 'one-dark-pro',
          transformers: [
            {
              pre(node) {
                // Custom styling for the pre element
                node.properties.style = `
                  background-color: var(--color-card);
                  border: 1px solid var(--color-border);
                  border-radius: 0.5rem;
                  margin: 0;
                  padding: 1rem;
                  overflow-x: auto;
                  font-size: 0.875rem;
                  line-height: 1.5;
                  max-width: 100%;
                  word-wrap: break-word;
                  ${title ? 'border-top-left-radius: 0; border-top-right-radius: 0;' : ''}
                `;
              },
              code(node) {
                // Custom styling for the code element
                node.properties.style = `
                  background: transparent;
                  color: var(--color-foreground);
                  display: block;
                  overflow-wrap: break-word;
                  white-space: pre-wrap;
                `;
              },
              span(node) {
                // Enhance token colors to match our theme
                if (node.properties.style) {
                  let style = node.properties.style as string;

                  // Claude orange for strings
                  if (style.includes('color:#CE9178')) {
                    style = style.replace('color:#CE9178', 'color:var(--color-primary)');
                  }
                  // Keywords
                  if (style.includes('color:#569CD6')) {
                    style = style.replace('color:#569CD6', 'color:var(--color-syntax-keyword)');
                  }
                  // Comments
                  if (style.includes('color:#6A9955')) {
                    style = style.replace('color:#6A9955', 'color:var(--color-muted-foreground)');
                  }
                  // Functions
                  if (style.includes('color:#DCDCAA')) {
                    style = style.replace('color:#DCDCAA', 'color:var(--color-syntax-function)');
                  }
                  // Numbers
                  if (style.includes('color:#B5CEA8')) {
                    style = style.replace('color:#B5CEA8', 'color:var(--color-syntax-number)');
                  }

                  node.properties.style = style;
                }
              },
            },
          ],
        });
        // Sanitize the generated HTML through our Zod schema
        const sanitizedHtml = highlightedCodeSafeSchema.parse(html);
        setHighlightedCode(sanitizedHtml);
      } catch (error) {
        logger.error(
          'Failed to highlight code syntax',
          error instanceof Error ? error : new Error(String(error)),
          {
            component: 'CodeHighlight',
            language: language,
          }
        );
        // Fallback to plain text with basic styling
        setHighlightedCode(`<pre style="
          background-color: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          margin: 0;
          padding: 1rem;
          overflow-x: auto;
          font-size: 0.875rem;
          line-height: 1.5;
          color: var(--color-foreground);
          ${title ? 'border-top-left-radius: 0; border-top-right-radius: 0;' : ''}
        "><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`);
      } finally {
        setIsLoading(false);
      }
    };

    highlightCode();
  }, [code, language, title]);

  const handleCopyCode = async () => {
    await copy(code);
  };

  return (
    <ErrorBoundary>
      <div className={`${UI_CLASSES.RELATIVE} ${UI_CLASSES.GROUP}`}>
        {title && (
          <div
            className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} bg-card/50 border-x border-t border-border rounded-t-lg px-4 py-2`}
          >
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            {showCopy && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isLoading}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}

        <div className={UI_CLASSES.RELATIVE}>
          {isLoading ? (
            <div
              className="animate-pulse bg-card border border-border rounded-lg p-4"
              style={{
                borderTopLeftRadius: title ? 0 : '0.5rem',
                borderTopRightRadius: title ? 0 : '0.5rem',
                minHeight: '4rem',
              }}
            >
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ) : (
            <div
              className="shiki-container"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki generates trusted HTML after sanitization
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          )}

          {showCopy && !title && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCode}
              className={`${UI_CLASSES.ABSOLUTE} top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm`}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Export memoized component to prevent unnecessary re-renders
export const CodeHighlight = memo(CodeHighlightComponent);
