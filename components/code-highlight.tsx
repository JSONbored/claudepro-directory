import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/clipboard-utils';
import { logger } from '@/lib/logger';

interface CodeHighlightProps {
  code: string;
  language?: string;
  title?: string;
  showCopy?: boolean;
}

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
        const html = await codeToHtml(code, {
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
        setHighlightedCode(html);
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
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
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
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        ) : (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki generates trusted HTML
          <div className="shiki-container" dangerouslySetInnerHTML={{ __html: highlightedCode }} />
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
  );
};
