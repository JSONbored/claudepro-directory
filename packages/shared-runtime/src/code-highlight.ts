/**
 * Code highlighting utility using Shiki
 * Shared between transform-api routes to prevent duplication
 * 
 * Replaced sugar-high with Shiki for:
 * - VS Code-quality syntax highlighting
 * - Better theme support (light/dark)
 * - Improved line spacing and typography
 * - Better language support (100+ languages)
 * 
 * Theme Management:
 * - Themes are configured in code-highlight-themes.ts
 * - Change THEME_CONFIG to switch themes globally
 * - All transformers are available via @shikijs/transformers
 */

import { codeToHtml } from 'shiki';
import type { ShikiTransformer } from 'shiki';
import {
  transformerNotationHighlight,
  transformerNotationWordHighlight,
  transformerNotationDiff,
  transformerNotationFocus,
  transformerRenderIndentGuides,
  transformerRenderWhitespace,
  transformerMetaHighlight,
} from '@shikijs/transformers';

import { normalizeError } from './error-handling.ts';
import { logger } from './logger/index.ts';
import { getThemeConfig } from './code-highlight-themes.ts';

export interface HighlightCodeOptions {
  maxVisibleLines?: number;
  showLineNumbers?: boolean;
  /**
   * Enable line highlighting with [!code highlight] notation
   * @default false
   */
  enableLineHighlighting?: boolean;
  /**
   * Enable word highlighting with [!code word:WORD] notation
   * @default false
   */
  enableWordHighlighting?: boolean;
  /**
   * Enable diff notation with [!code ++] / [!code --]
   * @default false
   */
  enableDiffNotation?: boolean;
  /**
   * Enable focus notation with [!code focus]
   * @default false
   */
  enableFocusNotation?: boolean;
  /**
   * Enable indent guides visualization
   * @default false
   */
  enableIndentGuides?: boolean;
  /**
   * Enable whitespace visualization (tabs/spaces)
   * @default false
   */
  enableWhitespace?: boolean;
  /**
   * Enable meta-based highlighting (e.g., {1,3-4} in code block meta)
   * @default false
   */
  enableMetaHighlight?: boolean;
}

/**
 * Transformer to add line numbers to Shiki output
 * Adds 'line' class and data-line attribute to each line
 */
const lineNumberTransformer: ShikiTransformer = {
  name: 'line-numbers',
  line(node, line) {
    // Add line number data attribute (1-indexed for display)
    // line is 0-indexed from Shiki, we want 1-indexed for display
    node.properties['data-line'] = String(line + 1);
    
    // Add 'line' class for styling
    // Use bracket notation for index signature properties
    const existingClass = node.properties['class'];
    const classValue = Array.isArray(existingClass)
      ? existingClass.join(' ')
      : typeof existingClass === 'string'
        ? existingClass
        : '';
    
    node.properties['class'] = classValue ? `${classValue} line` : 'line';
  },
};

/**
 * Highlight code with Shiki syntax highlighting
 * 
 * @param code - Code to highlight
 * @param language - Programming language (e.g., 'typescript', 'javascript', 'python')
 * @param options - Highlighting options
 * @param options.showLineNumbers - Whether to show line numbers (default: true)
 * @param options.maxVisibleLines - Maximum visible lines before expand button (default: 20, not used in HTML output, handled by component)
 * @returns Promise resolving to HTML string with highlighted code using Shiki
 * 
 * @example
 * ```ts
 * const html = await highlightCode('const x = 1;', 'typescript', { showLineNumbers: true });
 * ```
 */
export async function highlightCode(
  code: string,
  language: string,
  options: HighlightCodeOptions = {}
): Promise<string> {
  const {
    showLineNumbers = true,
    enableLineHighlighting = false,
    enableWordHighlighting = false,
    enableDiffNotation = false,
    enableFocusNotation = false,
    enableIndentGuides = false,
    enableWhitespace = false,
    enableMetaHighlight = false,
  } = options;

  try {
    // Normalize language (Shiki expects lowercase, no dots)
    // Map common aliases to Shiki language IDs
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'js': 'javascript',
      'py': 'python',
      'yml': 'yaml',
      'md': 'markdown',
      'sh': 'bash',
      'shell': 'bash',
    };
    
    const normalizedLang = (language?.toLowerCase().replace(/\./g, '') || 'text');
    const shikiLang = languageMap[normalizedLang] || normalizedLang;
    
    // Get theme configuration from centralized theme config
    const themes = getThemeConfig();
    
    // Build transformers array based on options
    const transformers: ShikiTransformer[] = [];
    
    // Line numbers (always first if enabled)
    if (showLineNumbers) {
      transformers.push(lineNumberTransformer);
    }
    
    // Line highlighting with [!code highlight] notation
    if (enableLineHighlighting) {
      transformers.push(transformerNotationHighlight());
    }
    
    // Word highlighting with [!code word:WORD] notation
    if (enableWordHighlighting) {
      transformers.push(transformerNotationWordHighlight());
    }
    
    // Diff notation with [!code ++] / [!code --]
    if (enableDiffNotation) {
      transformers.push(transformerNotationDiff());
    }
    
    // Focus notation with [!code focus]
    if (enableFocusNotation) {
      transformers.push(transformerNotationFocus());
    }
    
    // Indent guides visualization
    if (enableIndentGuides) {
      transformers.push(transformerRenderIndentGuides());
    }
    
    // Whitespace visualization (tabs/spaces)
    if (enableWhitespace) {
      transformers.push(transformerRenderWhitespace());
    }
    
    // Meta-based highlighting (e.g., {1,3-4} in code block meta)
    if (enableMetaHighlight) {
      transformers.push(transformerMetaHighlight());
    }
    
    // Use Shiki's codeToHtml with dual themes for light/dark mode support
    const html = await codeToHtml(code, {
      lang: shikiLang,
      themes: {
        light: themes.light,
        dark: themes.dark,
      },
      defaultColor: 'light',
      transformers,
    });

    // Shiki outputs <pre><code class="language-xxx">...</code></pre>
    // We'll style this via CSS targeting .shiki class
    return html;
  } catch (error) {
    const errorObj = normalizeError(error, 'Code highlighting failed');
    logger.warn({
      err: errorObj,
      function: 'code-highlight',
      operation: 'highlight-failed',
      language,
      code_preview: code.slice(0, 100),
    }, 'Shiki highlighting failed, using fallback');

    // Fallback: escape code and return plain HTML
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
