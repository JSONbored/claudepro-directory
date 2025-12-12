'use server';

import type { Database } from '@heyclaude/database-types';
import { logger } from '../logger.ts';
import { normalizeError } from '../errors.ts';
import type { ContentHeadingMetadata } from '../types/component.types.ts';
import {
  detectLanguage,
  extractMarkdownHeadings,
  generateFilename,
  generateHookFilename,
  highlightCode,
} from '@heyclaude/shared-runtime';

export interface HighlightCodeOptions {
  language?: string;
  showLineNumbers?: boolean;
}

export interface ProcessContentItem {
  category: Database['public']['Enums']['content_category'] | null;
  slug?: string | null;
  name?: string | null;
  hook_type?: string | null;
}

export interface ProcessContentOptions {
  operation: 'full' | 'filename' | 'highlight';
  code?: string;
  language?: string;
  languageHint?: string;
  showLineNumbers?: boolean;
  item?: ProcessContentItem;
  format?: 'json' | 'multi' | 'hook';
  section?: string;
  sectionKey?: string;
  contentType?: 'hookConfig' | 'scriptContent';
}

export interface ProcessContentResponse {
  html?: string;
  language?: string;
  filename?: string;
  error?: string;
  headings?: ContentHeadingMetadata[];
}

/**
 * Request syntax-highlighted HTML for a code snippet from the edge transform service.
 *
 * Sends the provided `code` and highlighting options to the edge endpoint and returns
 * the resulting HTML. If `code` is empty, returns a small preformatted placeholder.
 * If the edge service fails or returns an error, returns a safe, escaped fallback HTML block.
 *
 * @param code - The source code to highlight.
 * @param options - Highlighting options.
 * @param options.language - Language hint for the highlighter (defaults to `"javascript"`).
 * @param options.showLineNumbers - Whether to include line numbers in the output (defaults to `true`).
 * @returns An HTML string containing the highlighted code or a safe fallback/preformatted block when highlighting is unavailable.
 */
export async function highlightCodeEdge(
  code: string,
  options: HighlightCodeOptions = {}
): Promise<string> {
  const { language = 'javascript', showLineNumbers = true } = options;

  if (!code || code.trim() === '') {
    return '<pre class="sugar-high-empty"><code>No code provided</code></pre>';
  }

  try {
    return highlightCode(code, language, { showLineNumbers });
  } catch (error) {
    const normalized = normalizeError(error, 'Local highlighting failed, using fallback');
    logger.warn({ err: normalized,
      language,
      codePreview: code.slice(0, 80), }, 'Local highlighting failed, using fallback');

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
 * Request processing of content via the edge transform service using the provided options.
 *
 * @param options - Configuration for the processing request (operation, code, language, languageHint, showLineNumbers, item, format, section, sectionKey, contentType). `showLineNumbers` defaults to `true`.
 * @returns The processed content response; may include `html`, `language`, `filename`, `headings`, or an `error` message.
 * @throws If the edge endpoint responds with a non-OK HTTP status, throws an Error containing the status and response text.
 */
export async function processContentEdge(
  options: ProcessContentOptions
): Promise<ProcessContentResponse> {
  const {
    operation,
    code,
    language,
    languageHint,
    showLineNumbers = true,
    item,
    format,
    section,
    sectionKey,
    contentType,
  } = options;

  try {
    if (!operation || !['full', 'filename', 'highlight'].includes(operation)) {
      throw new Error("Invalid operation. Must be 'full', 'filename', or 'highlight'.");
    }

    const codeString = typeof code === 'string' ? code : undefined;
    const normalizedItem = item?.category
      ? {
          category: item.category,
          slug: item.slug ?? null,
          name: item.name ?? null,
          hook_type: item.hook_type ?? null,
        }
      : undefined;

    if ((operation === 'full' || operation === 'highlight') && !codeString?.trim()) {
      throw new Error('Code is required for the requested operation.');
    }

    if ((operation === 'full' || operation === 'filename') && !normalizedItem) {
      throw new Error('Item is required for the requested operation.');
    }

    if (operation === 'full') {
      const detectedLanguage = detectLanguage(codeString!, languageHint);
      const filename =
        format === 'multi' && section
          ? generateFilename({
              item: normalizedItem!,
              language: detectedLanguage,
              format,
              section,
            })
          : generateFilename({
              item: normalizedItem!,
              language: detectedLanguage,
              ...(format ? { format } : {}),
            });

      const html = highlightCode(codeString!, detectedLanguage, { showLineNumbers });
      const headings = extractMarkdownHeadings(codeString!);

      return {
        html,
        language: detectedLanguage,
        filename,
        ...(headings.length > 0 ? { headings } : {}),
      };
    }

    if (operation === 'filename') {
      let filename: string;
      if (format === 'multi' && sectionKey) {
        filename = generateFilename({
          item: normalizedItem!,
          language: language || 'json',
          format: 'multi',
          section: sectionKey,
        });
      } else if (format === 'hook' && contentType) {
        filename = generateHookFilename(normalizedItem!, contentType, language || 'json');
      } else {
        filename = generateFilename({
          item: normalizedItem!,
          language: language || 'json',
          ...(format ? { format } : {}),
          ...(section ? { section } : {}),
        });
      }
      return { filename };
    }

    // operation === 'highlight'
    const highlightLanguage = language ?? languageHint ?? 'javascript';
    const html = highlightCode(codeString!, highlightLanguage, { showLineNumbers });
    return { html, language: highlightLanguage };
  } catch (error) {
    const normalized = normalizeError(error, 'processContentEdge failed');
    logger.warn({ err: normalized }, 'processContentEdge error');
    throw normalized;
  }
}