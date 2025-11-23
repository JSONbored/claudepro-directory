/**
 * Code highlighting utility
 * Shared between transform-api routes to prevent duplication
 */

import { highlight } from 'sugar-high';
import { errorToString } from '@heyclaude/shared-runtime';
import { createUtilityContext } from '@heyclaude/shared-runtime';

export interface HighlightCodeOptions {
  showLineNumbers?: boolean;
  maxVisibleLines?: number;
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
    const highlighted = highlight(code);
    const lines = highlighted.split('\n');
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
    const logContext = createUtilityContext('code-highlight', 'highlight-failed', {
      code_preview: code.slice(0, 100),
    });
    console.warn('[code-highlight] Highlighting failed, using fallback', {
      ...logContext,
      error: errorToString(error),
    });

    // Fallback: escape code
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

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
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32-bit integer
  }
  return `highlight:${Math.abs(hash).toString(36)}`;
}
