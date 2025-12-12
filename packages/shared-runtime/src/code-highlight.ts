/**
 * Code highlighting utility
 * Shared between transform-api routes to prevent duplication
 */

import { highlight } from 'sugar-high';

import { normalizeError } from './error-handling.ts';
import { logger } from './logger/index.ts';

export interface HighlightCodeOptions {
  maxVisibleLines?: number;
  showLineNumbers?: boolean;
}

/**
 * Highlight code with syntax highlighting
 * @param code - Code to highlight
 * @param language - Language hint (currently unused but kept for API compatibility)
 * @param options - Highlighting options
 * @returns HTML string with highlighted code
 */
export function highlightCode(
  code: string,
  _language: string,
  options: HighlightCodeOptions = {}
): string {
  const { showLineNumbers = true, maxVisibleLines = 20 } = options;

  try {
    // sugar-high's highlight function returns string, but types may be incomplete
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- sugar-high types may be incomplete
    const highlighted = highlight(code) as string;
    const lines: string[] = highlighted.split('\n');
    const hasMultipleLines = lines.length > 1;
    const totalLines = lines.length;
    const visibleLines = Math.min(totalLines, maxVisibleLines);

    if (showLineNumbers && hasMultipleLines) {
      const numberedLines = lines
        .map((line: string, index: number) => {
          const lineNum = index + 1;
          return `<span class="sh__line" data-line="${lineNum}">${line || ' '}</span>`;
        })
        .join('\n');

      return `<div class="code-block-wrapper"><pre class="code-block-pre"><code class="sugar-high">${numberedLines}</code></pre>${totalLines > visibleLines ? `<button class="code-expand-btn">Expand ${totalLines - visibleLines} more lines</button>` : ''}</div>`;
    }

    return `<div class="code-block-wrapper"><pre class="code-block-pre"><code class="sugar-high">${highlighted}</code></pre></div>`;
  } catch (error) {
    const errorObj = normalizeError(error, 'Code highlighting failed');
    logger.warn({
      err: errorObj,
      function: 'code-highlight',
      operation: 'highlight-failed',
      code_preview: code.slice(0, 100),
    }, 'Highlighting failed, using fallback');

    // Fallback: escape code
    const escapedCode = code
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll('\'', '&#039;');

    return `<pre class="code-block-pre code-block-fallback"><code>${escapedCode}</code></pre>`;
  }
}

/**
 * Generate cache key for highlighted code
 * Deterministic hash based on code content, language, and line number setting
 */
export function generateHighlightCacheKey(
  code: string,
  language: string,
  showLineNumbers: boolean
): string {
  const input = `${code}:${language}:${showLineNumbers}`;
  // Simple hash function (good enough for cache keys)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.codePointAt(i) ?? 0;
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32-bit integer
  }
  return `highlight:${Math.abs(hash).toString(36)}`;
}
