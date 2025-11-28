'use server';

import type { Database } from '@heyclaude/database-types';
import { logger } from '../logger.ts';
import { normalizeError } from '../errors.ts';
import { getEnvVar } from '@heyclaude/shared-runtime';
import type { ContentHeadingMetadata } from '../types/component.types.ts';

const EDGE_TRANSFORM_URL = `${getEnvVar('NEXT_PUBLIC_SUPABASE_URL')}/functions/v1/public-api`;

export interface HighlightCodeOptions {
  language?: string;
  showLineNumbers?: boolean;
}

export interface HighlightCodeResponse {
  html: string;
  cached: boolean;
  cacheKey?: string;
  error?: string;
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
    const response = await fetch(`${EDGE_TRANSFORM_URL}/transform/highlight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, showLineNumbers }),
      cache: 'force-cache',
      next: {
        revalidate: 31536000,
        tags: ['transform:highlight'],
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Highlight failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as HighlightCodeResponse;

    if (data.error) {
      logger.warn('Edge highlighting used fallback', undefined, {
        error: data.error,
        language,
        codePreview: code.slice(0, 80),
      });
    }

    return data.html;
  } catch (error) {
    const normalized = normalizeError(error, 'Edge highlighting failed, using fallback');
    
    // During build, edge functions may be unavailable - this is expected
    // Only log at debug level during build, warn during runtime
    const isBuildTime = process.env['NEXT_PHASE'] === 'phase-production-build' || 
                        process.env['NEXT_PUBLIC_VERCEL_ENV'] === undefined;
    
    if (isBuildTime) {
      logger.debug('Edge highlighting unavailable during build, using fallback', {
        language,
        codePreview: code.slice(0, 80),
      });
    } else {
      logger.warn('Edge highlighting failed, using fallback', {
        err: normalized,
        language,
        codePreview: code.slice(0, 80),
      });
    }

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

  const response = await fetch(`${EDGE_TRANSFORM_URL}/transform/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation,
      code,
      language,
      languageHint,
      showLineNumbers,
      item,
      format,
      section,
      sectionKey,
      contentType,
    }),
    cache: 'force-cache',
    next: {
      revalidate: 31536000,
      tags: ['transform:content'],
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Process content failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as ProcessContentResponse;
  if (data.error) {
    const normalized = normalizeError(new Error(data.error), 'Process content edge error');
    // Pino's stdSerializers.err automatically handles error serialization
    logger.warn('processContentEdge fallback', { err: normalized });
  }
  return data;
}