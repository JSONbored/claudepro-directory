'use client';

import { Check, Copy } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { ErrorBoundary } from '@/components/error-boundary';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/clipboard-utils';
import { logger } from '@/lib/logger';
import type { CodeHighlightProps } from '@/lib/schemas/component.schema';
import { highlightedCodeSafeSchema } from '@/lib/schemas/form.schema';

// Optimized language support - only languages actually used in codebase
const SUPPORTED_LANGUAGES = [
  'bash',
  'json',
  'javascript',
  'typescript',
  'markdown',
  'plaintext',
] as const;

// Validate and normalize language for security and bundle optimization
function validateLanguage(language: string): string {
  const normalizedLang = language.toLowerCase().trim();

  // Map common aliases to supported languages
  const languageMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    sh: 'bash',
    shell: 'bash',
    md: 'markdown',
    jsonc: 'json',
  };

  const mappedLang = languageMap[normalizedLang] || normalizedLang;

  if (SUPPORTED_LANGUAGES.includes(mappedLang as (typeof SUPPORTED_LANGUAGES)[number])) {
    return mappedLang;
  }

  // Fallback to plaintext for unsupported languages
  return 'plaintext';
}

// CodeHighlightProps is now imported from component.schema.ts

export const CodeHighlight = ({
  code,
  language = 'typescript',
  title,
  showCopy = true,
}: CodeHighlightProps) => {
  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const highlightCode = async () => {
      setIsLoading(true);
      try {
        const validatedLanguage = validateLanguage(language);
        const html = await codeToHtml(code, {
          lang: validatedLanguage,
          theme: 'github-dark-dimmed',
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
                    style = style.replace('color:#569CD6', 'color:#ff8c00'); // Claude orange
                  }
                  // Comments
                  if (style.includes('color:#6A9955')) {
                    style = style.replace('color:#6A9955', 'color:var(--color-muted-foreground)');
                  }
                  // Functions
                  if (style.includes('color:#DCDCAA')) {
                    style = style.replace('color:#DCDCAA', 'color:#00bcd4');
                  }
                  // Numbers
                  if (style.includes('color:#B5CEA8')) {
                    style = style.replace('color:#B5CEA8', 'color:#4caf50');
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
    const success = await copyToClipboard(code, {
      component: 'CodeHighlight',
      action: 'copy-code',
    });

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <ErrorBoundary>
      <div className="relative group">
        {title && (
          <div className="flex items-center justify-between bg-card/50 border-x border-t border-border rounded-t-lg px-4 py-2">
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

        <div className="relative">
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
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Loading component for dynamic imports
export const CodeHighlightLoader = () => (
  <div className="animate-pulse bg-card border border-border rounded-lg p-4 min-h-[4rem]">
    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
    <div className="h-4 bg-muted rounded w-1/2" />
  </div>
);

// Dynamic version for lazy loading (consolidates code-highlight-dynamic.tsx functionality)
export const CodeHighlightDynamic = dynamic(() => Promise.resolve({ default: CodeHighlight }), {
  loading: () => <CodeHighlightLoader />,
  ssr: false, // Disable SSR for this component as it uses browser APIs
});
