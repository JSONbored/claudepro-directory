/**
 * Syntax Highlighting - React cache() memoized Sugar High renderer
 */

import { cache } from 'react';
import { highlight } from 'sugar-high';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

export const highlightCode = cache(
  (code: string, _language = 'javascript', showLineNumbers = true): string => {
    if (!code || code.trim() === '') {
      return '<pre class="sugar-high-empty"><code>No code provided</code></pre>';
    }

    try {
      const highlighted = highlight(code);
      const lines = highlighted.split('\n');
      const hasMultipleLines = lines.length > 1;
      const totalLines = lines.length;
      const visibleLines = Math.min(totalLines, 20);

      if (showLineNumbers && hasMultipleLines) {
        const numberedLines = lines
          .map((line, index) => {
            const lineNum = index + 1;
            return `<span class="sh__line" data-line="${lineNum}">${line || ' '}</span>`;
          })
          .join('\n');

        return `<div class="code-block-wrapper"><pre class="code-block-pre"><code class="sugar-high">${numberedLines}</code></pre>${totalLines > visibleLines ? `<button class="code-expand-btn">Expand ${totalLines - visibleLines} more lines</button>` : ''}</div>`;
      }

      return `<div class="code-block-wrapper"><pre class="code-block-pre"><code class="sugar-high">${highlighted}</code></pre></div>`;
    } catch (error) {
      const normalized = normalizeError(error, 'highlightCode failed');
      logger.warn('highlightCode: highlight failed', {
        preview: code.slice(0, 80),
        language: _language,
        error: normalized.message,
      });
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      return `<pre class="code-block-pre code-block-fallback"><code>${escapedCode}</code></pre>`;
    }
  }
);

export function extractRawCode(highlightedHtml: string): string {
  // Use iterative approach to handle nested/malformed tags (CodeQL security recommendation)
  let prev: string;
  let stripped = highlightedHtml;
  do {
    prev = stripped;
    stripped = stripped.replace(/<[^>]*>/g, '');
  } while (stripped !== prev);
  return stripped.trim();
}
