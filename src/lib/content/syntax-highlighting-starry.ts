/**
 * Server-Side Syntax Highlighting with Starry Night
 *
 * Replaces Shiki with Starry Night (100x smaller: ~34KB vs 3.6MB)
 *
 * Benefits:
 * - Zero client-side JavaScript for highlighting
 * - No browser main thread blocking
 * - Instant page loads with pre-rendered HTML
 * - Beautiful syntax highlighting (same TextMate grammars as VSCode)
 * - Shared singleton (no duplicate instances)
 * - 100x smaller bundle size
 */

import { toHtml } from 'hast-util-to-html';
import { getSharedHighlighter, normalizeLanguage } from './starry-night-singleton';

/**
 * Highlight code on the server with optional line numbers
 * Returns pre-rendered HTML string ready for dangerouslySetInnerHTML
 */
export async function highlightCode(
  code: string,
  language = 'text',
  showLineNumbers = true
): Promise<string> {
  try {
    const highlighter = await getSharedHighlighter();
    const scope = normalizeLanguage(language, highlighter);

    // Highlight code to HAST (Hypertext Abstract Syntax Tree)
    const tree = highlighter.highlight(code, scope);

    // Convert HAST to HTML
    const highlightedCode = toHtml(tree);

    // Wrap in pre/code with styling
    const lines = code.split('\n');
    const hasMultipleLines = lines.length > 1;

    if (showLineNumbers && hasMultipleLines) {
      // Split highlighted HTML by lines and add line number spans
      const highlightedLines = highlightedCode.split('\n');
      const numberedLines = highlightedLines
        .map((line, i) => {
          return `<span class="line-number" data-line="${i + 1}">${line || ' '}</span>`;
        })
        .join('\n');

      return `<pre class="overflow-x-auto text-sm leading-relaxed p-4 rounded-lg border border-border bg-code/50 backdrop-blur-sm"><code class="starry-night" style="display: grid; background: transparent;">${numberedLines}</code></pre>`;
    }

    // No line numbers - simple wrap
    return `<pre class="overflow-x-auto text-sm leading-relaxed p-4 rounded-lg border border-border bg-code/50 backdrop-blur-sm"><code class="starry-night" style="display: block; background: transparent;">${highlightedCode}</code></pre>`;
  } catch (_error) {
    // Fallback to plain text if highlighting fails
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return `<pre class="overflow-x-auto text-sm leading-relaxed p-4 rounded-lg border border-border bg-code/50 backdrop-blur-sm"><code style="color: var(--color-text-secondary);">${escapedCode}</code></pre>`;
  }
}
