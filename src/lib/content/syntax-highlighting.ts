/**
 * Consolidated Syntax Highlighting - Single Source of Truth
 *
 * Production-grade Sugar High implementation (1KB, 7x faster than Shiki)
 * This is the ONLY syntax highlighting function in the entire codebase.
 *
 * @example
 * import { highlightCode } from '@/src/lib/content/syntax-highlighting';
 * const html = highlightCode('const x = 1;', 'javascript', true);
 */

import { highlight } from 'sugar-high';

/**
 * Highlight code using Sugar High (CANONICAL FUNCTION)
 *
 * @param code - Raw code string to highlight
 * @param language - Programming language (auto-detected by Sugar High, parameter kept for API compatibility)
 * @param showLineNumbers - Whether to add line numbers (default: false)
 * @returns HTML string with syntax highlighting
 */
export function highlightCode(
  code: string,
  _language = 'javascript',
  showLineNumbers = false
): string {
  if (!code || code.trim() === '') {
    return '<pre class="sugar-high-empty"><code>No code provided</code></pre>';
  }

  try {
    // Sugar High returns HTML with inline styles via CSS variables
    const highlighted = highlight(code);

    // Split into lines for line number support
    const lines = highlighted.split('\n');
    const hasMultipleLines = lines.length > 1;

    if (showLineNumbers && hasMultipleLines) {
      // Wrap each line in .sh__line with data-line attribute
      const numberedLines = lines
        .map((line, index) => {
          const lineNum = index + 1;
          return `<span class="sh__line" data-line="${lineNum}">${line || ' '}</span>`;
        })
        .join('\n');

      return `<pre class="overflow-x-auto text-sm p-4 rounded-lg border border-border bg-code/60" style="line-height: 1.5; box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03), 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.15);"><code class="sugar-high" style="display: grid; background: transparent; line-height: 1.5;">${numberedLines}</code></pre>`;
    }

    // No line numbers - simple wrap
    return `<pre class="overflow-x-auto text-sm p-4 rounded-lg border border-border bg-code/60" style="line-height: 1.5; box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03), 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.15);"><code class="sugar-high" style="display: block; background: transparent; line-height: 1.5;">${highlighted}</code></pre>`;
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

/**
 * Extract raw code from highlighted HTML (for copy functionality)
 * Sugar High doesn't wrap content heavily, so we can use textContent
 */
export function extractRawCode(highlightedHtml: string): string {
  // Remove HTML tags to get plain text
  return highlightedHtml.replace(/<[^>]*>/g, '').trim();
}
